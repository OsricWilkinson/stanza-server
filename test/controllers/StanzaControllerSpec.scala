package controllers

import org.scalatestplus.play._
import org.scalatestplus.play.guice._
import play.Environment
import play.api.libs
import play.api.libs.json.{JsArray, JsDefined, JsValue, Json}
import play.api.test._
import play.api.test.Helpers._

/**
  * Add your spec here.
  * You can mock out a whole application including requests, plugins etc.
  *
  * For more information, see https://www.playframework.com/documentation/latest/ScalaTestingWithScalaTest
  */
class StanzaControllerSpec extends PlaySpec with GuiceOneAppPerTest with Injecting {

  val startStanza = Json.parse("""{"type":"InstructionStanza","text":0,"next":["1"]}""")

  "StanzaController GET" should {

    "return a JSON blob for a stanza" in {
      val request = FakeRequest(GET, "/process/oct90001/stanza/start")
      val stanza = route(app, request).get

      status(stanza) mustBe OK
      contentType(stanza) mustBe Some("application/json")
      contentAsJson(stanza) mustBe startStanza
    }

    "return a JSON blob for a phrase" in {
      val request = FakeRequest(GET, "/process/oct90001/phrases?ids=0")
      val stanza = route(app, request).get

      status(stanza) mustBe OK
      contentType(stanza) mustBe Some("application/json")
      (contentAsJson(stanza) \ 0).isDefined mustBe true
    }

    "return a JSON blob for a list of phrases" in {
      val request = FakeRequest(GET, "/process/oct90001/phrases?ids=0,1,2")
      val stanza = route(app, request).get

      status(stanza) mustBe OK
      contentType(stanza) mustBe Some("application/json")

      val json = contentAsJson(stanza)
      (json \ 0).isDefined mustBe true
      json.as[JsArray].value.length mustBe 3
    }

    "return 404 for invalid stanzas" in {
      val request = FakeRequest(GET, "/process/oct90001/stanza/bogus")
      val stanza = route(app, request).get

      status(stanza) mustBe NOT_FOUND
      contentType(stanza) mustBe Some("application/json")
      (contentAsJson(stanza) \ "error").isDefined mustBe true
    }

    "return 404 for invalid phrase" in {
      val request = FakeRequest(GET, "/process/oct90001/phrases?ids=123456")
      val stanza = route(app, request).get

      status(stanza) mustBe NOT_FOUND
      contentType(stanza) mustBe Some("application/json")
      (contentAsJson(stanza) \ "error").isDefined mustBe true
    }

    "return 404 for invalid process (stanza version)" in {
      val request = FakeRequest(GET, "/process/bogus/stanza/start")
      val stanza = route(app, request).get

      status(stanza) mustBe NOT_FOUND
      contentType(stanza) mustBe Some("application/json")
      (contentAsJson(stanza) \ "error").isDefined mustBe true
    }

    "return 404 for invalid process (phrase version)" in {
      val request = FakeRequest(GET, "/process/bogus/phrases?ids=0")
      val stanza = route(app, request).get

      status(stanza) mustBe NOT_FOUND
      contentType(stanza) mustBe Some("application/json")
      (contentAsJson(stanza) \ "error").isDefined mustBe true
    }


  }
}
