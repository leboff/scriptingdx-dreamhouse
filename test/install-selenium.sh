#!/usr/bin/env bash

outputDir=${1:-}

if [ ! -f "testartifacts/selenium-java.zip" ]; then
    curl -o $outputDir/selenium-java.zip http://selenium-release.storage.googleapis.com/3.0-beta3/selenium-java-3.0.0-beta3.zip
else
  echo "Selenium client zip exist"
fi

echo "Installing Selenium client..."
unzip -o $outputDir/selenium-java -d $outputDir/selenium-client-jars
