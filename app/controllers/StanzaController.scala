package controllers

import java.io.FileInputStream
import java.lang.IllegalArgumentException
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
      val targetFile = environment.getFile("/conf/assets/" + processId + ".json")

      if (targetFile.exists()) {

        val process: JsValue = Json.parse(new FileInputStream(targetFile))
        val phraseSeq = (process \ "phrases").as[JsArray].value

        def lookupPhrase(idx: Int): JsValue = {
          if (idx < 0 || idx >= phraseSeq.length) {
            throw new IllegalArgumentException("Phrase id " + idx + " out of range:" + phraseSeq.length)
          }
          phraseSeq(idx)
        }

        try {
          val result = ids.split(",")
            .map(x => Integer.parseInt(x, 10))
            .map(x => lookupPhrase(x))
          Ok(JsArray(result)).as("application/json")
        } catch {
          case ex: IllegalArgumentException => NotFound(Json.obj("error" -> ex.getMessage)).as("application/json")
        }

      } else {
        NotFound(Json.obj("error" -> "Process not found")).as("application/json")
      }
    }
  }

  def getStanza(processId: String, stanzaId: String) = Action {
    request: Request[AnyContent] => {

      val targetFile = environment.getFile("/conf/assets/" + processId + ".json")

      if (targetFile.exists()) {
        val process: JsValue = Json.parse(new FileInputStream(targetFile))

        val transform = (__ \ "flow" \ stanzaId).json.pick

        val result = process.transform(transform)

        if (result.isSuccess) {
          Ok(result.get).as("application/json")
        } else {
          NotFound(Json.obj("error" -> "Stanza not found")).as("application/json")
        }
      } else {
        NotFound(Json.obj("error" -> "Process not found")).as("application/json")
      }
    }
  }

  def getLink(processId: String, idx: Int) = Action {
    getProcess(processId) match {
      case None => NotFound(Json.obj("error" -> "Process not found")).as("application/json")
      case Some(process) => Ok((process \ "meta" \ "links" \ idx).getOrElse(Json.parse("")))
    }
  }

  private def getProcess(id: String): Option[JsValue] = {

    val targetFile = environment.getFile("/conf/assets/" + id + ".json")

    if (targetFile.exists()) {

      Some(Json.parse(new FileInputStream(targetFile)))
    } else {
      None
    }
  }

}
