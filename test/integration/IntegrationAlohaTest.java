package test.integration;

import org.junit.*;
import org.openqa.selenium.*;

import org.junit.runner.JUnitCore;

/**
 * Property Explorer UI test.
 */
public class IntegrationAlohaTest extends BaseSalesforceTest {
    @Test
    public void testPropertyExplorer() {
        try {
            this.login("/a02/o");

            this.fluentWait(By.linkText("Contemporary Luxury")).click();

            Assert.assertTrue(this.fluentWait(By.xpath("//h2[contains(text(), 'Contemporary Luxury')]")).isDisplayed());

            WebElement brokerElementAnchor = this.fluentWait(By.linkText("Michael Jones"));
            Assert.assertNotNull(brokerElementAnchor);
        } catch(Exception e) {
            System.err.println(driver.getPageSource());
            throw e;
        }
    }

	public static void main(String[] args) {
		// Instantiate a JUniteCore object
		JUnitCore core = new JUnitCore();

		// Add TAP Reporter Listener to the core object executor
		core.addListener(new TapReporter());

		// Run the test suite
		core.run(IntegrationAlohaTest.class);
	}
}
