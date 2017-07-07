package controllers

import org.scalatestplus.play._
import org.scalatestplus.play.guice._
import play.Environment
import play.api.libs
import play.api.libs.json.JsDefined
import play.api.test._
import play.api.test.Helpers._

/**
  * Add your spec here.
  * You can mock out a whole application including requests, plugins etc.
  *
  * For more information, see https://www.playframework.com/documentation/latest/ScalaTestingWithScalaTest
  */
class StanzaControllerSpec extends PlaySpec with GuiceOneAppPerTest with Injecting {

  "StanzaController GET" should {

    "return a json blob for the start stanza" in {
      val controller = new StanzaController(stubControllerComponents(), Environment.simple())
      val stanza = controller.get("oct90001", "start").apply(FakeRequest(GET, "/"))

      status(stanza) mustBe OK
      contentType(stanza) mustBe Some("application/json")
      contentAsString(stanza) must include ("next")
    }

    "render the index page from the application" in {
      val controller = inject[StanzaController]
      val home = controller.get("oct9001", "start").apply(FakeRequest(GET, "/process/fake"))

      status(home) mustBe NOT_FOUND

    }

    "render the index page from the router" in {
      val request = FakeRequest(GET, "/")
      val home = route(app, request).get

      status(home) mustBe OK
      contentType(home) mustBe Some("text/html")
      contentAsString(home) must include ("Welcome to Play")
    }
  }
}
