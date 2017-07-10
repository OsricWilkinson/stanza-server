package controllers

import java.io.FileInputStream
import javax.inject._

import play.api.libs.json._
import play.api.libs.json.Reads._
import play.api.libs.functional.syntax._
import play.api.mvc._
import play.Environment


@Singleton
class StanzaController @Inject()(cc: ControllerComponents, environment: Environment) extends AbstractController(cc) {


  def get(processId: String, stanzaId: String) = Action { implicit request: Request[AnyContent] => {

    val targetFile = environment.getFile("/conf/assets/" + processId + ".js")

    if (targetFile.exists()) {
      val process: JsValue = Json.parse(new FileInputStream(targetFile))

      def lookupPhrase(idx: Int): JsValue = {
        (process \ "phrases") (idx).as[JsValue]
      }

      val transform = (__ \ "flow" \ stanzaId).json.pick(
        (__ \ "text").json.update(
          of[JsNumber].map(o => lookupPhrase(o.as[Int]))
        )
      )

      val result = process.transform(transform)

      Ok(result.get).as("application/json")

    } else {
      NotFound("Process " + processId + " not found")
    }
  }
  }
}
