package controllers

import java.io.FileInputStream
import javax.inject._

import play.api.libs.json.{JsValue, Json}
import play.api.libs.json._
import play.api.libs.functional.syntax._
import play.api.mvc._
import play.Environment


case class Stanza(`type`: String, text: Option[Int], next: Option[Seq[String]])
case class Phrase(text: String)
case class Process(flow: Map[String, Stanza], phrases: Seq[Phrase])

@Singleton
class StanzaController @Inject()(cc: ControllerComponents, environment: Environment) extends AbstractController(cc) {

  implicit val stanzaReader = Json.format[Stanza]

  implicit val phraseReader: Reads[Phrase] = (
    ( JsPath.read[String] orElse
    JsPath.read[Seq[String]].map[String](q => q(0))
      ).map[Phrase](x => Phrase(x))
  )

  implicit val processReader = Json.reads[Process]

  def get(processId: String, stanzaId: String) = Action { implicit request: Request[AnyContent] => {

    val targetFile = environment.getFile("/conf/assets/" + processId + ".js")

    if (targetFile.exists()) {
      val process = Json.parse(new FileInputStream(targetFile)).as[Process]
      val stanza = process.flow(stanzaId)

      if (stanza.text.isDefined)
        Ok(process.phrases(stanza.text.get).text)
      else
        NotFound("Can't find text for " + processId + "." + stanzaId)

    } else {
      NotFound("Process " + processId + " not found")
    }
  }
  }
}
