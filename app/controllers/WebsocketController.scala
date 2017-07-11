package controllers

import java.io.FileInputStream
import javax.inject.Inject

import akka.actor.ActorSystem
import akka.stream.Materializer
import play.api.mvc._
import akka.stream.scaladsl._
import play.Environment
import play.api.libs.json._


/**
  * Created by osric on 11/07/2017.
  */
class WebsocketController  @Inject()(cc:ControllerComponents, environment: Environment) (implicit system: ActorSystem, mat: Materializer) extends AbstractController(cc) {


  def socket = WebSocket.accept[JsValue, JsValue] { request =>

    val targetFile = environment.getFile("/conf/assets/oct90001.js")

    val process: JsValue = Json.parse(new FileInputStream(targetFile))


    Flow[JsValue].map { msg =>
      if ((msg \ "stanza").isDefined) {
        val stanzaId = (msg \ "stanza").as[String]

        (process \ "flow" \ stanzaId).get
      } else if ((msg \ "phrases").isDefined) {
        val phraseList = (msg \ "phrases").as[String]

        def lookupPhrase(idx: Int): JsValue = {
          (process \ "phrases") (idx).as[JsValue]
        }

        val result: Seq[JsValue] = phraseList.split(",")
          .map(x => Integer.parseInt(x, 10))
          .map(x => Json.obj(x.toString() -> lookupPhrase(x)))

          Json.toJson(result)
      } else {

        Json.obj("error" -> "Missing parameters")
      }
    }
  }

}
