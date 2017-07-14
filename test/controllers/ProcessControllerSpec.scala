package controllers

import org.scalatestplus.play._
import org.scalatestplus.play.guice._
import play.api.libs.json.{JsArray, Json}
import play.api.test.Helpers._
import play.api.test._

/**
  * Add your spec here.
  * You can mock out a whole application including requests, plugins etc.
  *
  * For more information, see https://www.playframework.com/documentation/latest/ScalaTestingWithScalaTest
  */
class ProcessControllerSpec extends PlaySpec with GuiceOneAppPerTest with Injecting {

  "ProcessController GET" should {

    "return a JSON blob for a valid process" in {
      val request = FakeRequest(GET, "/process/oct90001")
      val process = route(app, request).get

      status(process) mustBe OK
      contentType(process) mustBe Some("application/json")

      val json = contentAsJson(process)

      (json \ "meta").isDefined mustBe true
      (json \ "flow").isDefined mustBe true
      (json \ "phrases").isDefined mustBe true
    }

    "return 404 for invalid process" in {
      val request = FakeRequest(GET, "/process/bogus")
      val stanza = route(app, request).get

      status(stanza) mustBe NOT_FOUND
      contentType(stanza) mustBe Some("application/json")
      (contentAsJson(stanza) \ "error").isDefined mustBe true
    }
  }
}
