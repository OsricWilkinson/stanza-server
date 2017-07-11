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

  def getPhrase(processId: String, ids: String) = Action {
    request: Request[AnyContent] => {
      val targetFile = environment.getFile("/conf/assets/" + processId + ".js")

      if (targetFile.exists()) {

        val process: JsValue = Json.parse(new FileInputStream(targetFile))

        def lookupPhrase(idx: Int): JsValue = {
          (process \ "phrases") (idx).as[JsValue]
        }

        val result = ids.split(",")
          .map(x => Integer.parseInt(x, 10))
          .map(x => lookupPhrase(x))

        Ok(JsArray(result)).as("application/json")

      } else {
        NotFound("Process " + processId + " not found")
      }
    }
  }

  def getStanza(processId: String, stanzaId: String) = Action {
    request: Request[AnyContent] => {

      val targetFile = environment.getFile("/conf/assets/" + processId + ".js")

      if (targetFile.exists()) {
        val process: JsValue = Json.parse(new FileInputStream(targetFile))

        val transform = (__ \ "flow" \ stanzaId).json.pick

        val result = process.transform(transform)

        Ok(result.get).as("application/json")

      } else {
        NotFound("Process " + processId + " not found")
      }
    }
  }
}
