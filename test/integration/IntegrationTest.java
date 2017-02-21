package test.integration;

import org.junit.*;
import org.openqa.selenium.*;

import org.junit.runner.JUnitCore;

/**
 * Property Explorer UI test.
 */
public class IntegrationTest extends BaseSalesforceTest {
    @Test
    public void testPropertyExplorer() {
    	String propertyExplorer = "#/n/Property_Explorer";
        this.login("/one/one.app" + propertyExplorer);

        // Salesforce retUrl will strip the hash. Selenium driver.get() will hang on a hash. SO set the hash manually.
        ((JavascriptExecutor) driver).executeScript("window.location.hash='" + propertyExplorer + "'");

        // Close the "Welcome to Salesforce" modal if it is displayed
        try {
            WebElement welcome = this.fluentWait(By.className("slds-modal__close"), 3);
            if (welcome != null) {
                welcome.click();
            }
        } catch(TimeoutException ex) {
            // ignore: may not have popped up
        }

        // property explorer
        WebElement propertyElementDiv = this.fluentWait(By.xpath("//h1[contains(text(), 'Contemporary Luxury')]"));
        Assert.assertNotNull(propertyElementDiv);
        WebElement propertyElementAnchor = propertyElementDiv.findElement(By.xpath("./..")).findElement(By.xpath("./.."));
        Assert.assertNotNull(propertyElementAnchor);
        propertyElementAnchor.click();

        // property detail
        WebElement propertyDetailElementSpan = this.fluentWait(By.xpath("//span[contains(text(), 'Contemporary Luxury')]"));
        Assert.assertNotNull(propertyDetailElementSpan);
        WebElement brokerElementAnchor = this.fluentWait(By.xpath("//a[contains(text(), 'Michael Jones')]"));
        Assert.assertNotNull(brokerElementAnchor);
    }

	public static void main(String[] args) {
		// Instantiate a JUniteCore object
		JUnitCore core = new JUnitCore();

		// Add TAP Reporter Listener to the core object executor
		core.addListener(new TapReporter());

		// Run the test suite
		core.run(IntegrationTest.class);
	}
}
