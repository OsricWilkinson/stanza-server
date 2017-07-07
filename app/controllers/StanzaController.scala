package controllers

import java.io.FileInputStream
import javax.inject._

import play.api.libs.json.{JsValue, Json}
import play.api.mvc._
import play.Environment


@Singleton
class StanzaController @Inject()(cc: ControllerComponents, environment: Environment) extends AbstractController(cc) {


  def get(processId: String, stanzaId: String) = Action { implicit request: Request[AnyContent] => {

    val targetFile = environment.getFile("/conf/assets/" + processId + ".js")

    if (targetFile.exists()) {
      val json: JsValue = Json.parse(new FileInputStream(targetFile))

      Ok((json \ "flow" \ stanzaId).get).as("application/json")

    } else {
      NotFound("Process " + processId + " not found")

    }


  }
  }
}
