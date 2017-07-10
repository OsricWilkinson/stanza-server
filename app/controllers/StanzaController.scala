package controllers

import java.io.FileInputStream
import javax.inject._

import play.api.libs.json.{JsValue, Json}
import play.api.libs.json._
import play.api.libs.functional.syntax._
import play.api.mvc._
import play.Environment


case class Stanza(`type`: String, text: Option[Int], answers: Option[Seq[Int]], next: Option[Seq[String]])
case class Phrase(text: Seq[String])
case class Process(flow: Map[String, Stanza], phrases: Seq[Phrase])

@Singleton
class StanzaController @Inject()(cc: ControllerComponents, environment: Environment) extends AbstractController(cc) {

  implicit val stanzaReader = Json.format[Stanza]

  implicit val phraseReader: Reads[Phrase] = (
    ( JsPath.read[Seq[String]] orElse
      JsPath.read[String].map[Seq[String]](q => q :: Nil)
      ).map[Phrase](x => Phrase(x))
    )


  implicit val processReader = Json.reads[Process]

  def get(processId: String, stanzaId: String) = Action { implicit request: Request[AnyContent] => {

    val targetFile = environment.getFile("/conf/assets/" + processId + ".js")

    if (targetFile.exists()) {
      val process = Json.parse(new FileInputStream(targetFile)).as[Process]
      val stanza = process.flow(stanzaId)

      if (stanza.text.isDefined) {
        var result: JsObject = Json.obj(
          "type" -> stanza.`type`,
          "text" -> process.phrases(stanza.text.get).text(0),
          "next" -> stanza.next
        )

        if (stanza.answers.isDefined) {
          result = result + ("answers" -> Json.arr(stanza.answers.get.map(i => process.phrases(i).text(0))))
        }

        Ok(Json.prettyPrint(result).toString).as("application/json")
      } else
        NotFound("Can't find text for " + processId + "." + stanzaId)

    } else {
      NotFound("Process " + processId + " not found")
    }
  }
  }
}
