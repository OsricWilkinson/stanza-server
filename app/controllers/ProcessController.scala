package controllers

import java.io.FileInputStream
import javax.inject._

import play.Environment
import play.api.libs.json.Reads._
import play.api.libs.json._
import play.api.mvc._


@Singleton
class ProcessController @Inject()(cc: ControllerComponents, environment: Environment) extends AbstractController(cc) {

  def getProcess(processId: String) = Action {

    val targetFile = environment.getFile("/conf/assets/" + processId + ".js")

    if (targetFile.exists()) {
      val process: JsValue = Json.parse(new FileInputStream(targetFile))

      Ok(Json.toJson(process)).as("application/json")
    } else {
      NotFound("Process " + processId + " not found")
    }
  }
}
