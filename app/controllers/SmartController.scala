package controllers

import java.io.FileInputStream
import javax.inject.Inject

import play.Environment
import play.api.libs.json.{JsArray, JsValue, Json}
import play.api.mvc._

class SmartController @Inject()(cc: ControllerComponents, environment: Environment) extends AbstractController(cc) {

  def getResult(processId: String) = Action {
    getProcess(processId) match {
   //   case Some(process) => Ok(views.html.smart(Json.stringify(process)))
      case Some(process) => Ok(views.html.smart())
      case None => NotFound( "Process not found")
    }
  }


  private def getProcess(id: String): Option[JsValue] = {

    val targetFile = environment.getFile("/conf/assets/" + id + ".js")

    if (targetFile.exists()) {

      Some(Json.parse(new FileInputStream(targetFile)))
    } else {
      None
    }
  }

  private def getStanza(process: JsValue, rawPath: String): Option[Stanza] = {

    val id = rawPath.split("/").lastOption match {
      case Some(x) => x
      case None => "End"
    }

    val raw = (process \ "flow" \ id).get

    val next = (raw \ "next").get

    None
  }

  private def getPhrase(process: JsValue, id: Int): Option[String] = {
    val phraseSeq = (process \ "phrases").as[JsArray].value

    if (id >= 0 && id < phraseSeq.length) {
      val phrase = phraseSeq(id)
      Some(phrase.toString())
    } else {
      None
    }

  }

}
