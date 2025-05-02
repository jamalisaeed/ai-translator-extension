# AI Translator Chrome Extension

A Chrome extension that adds a floating translation icon to text inputs on web pages. Click the icon to send text to an AI service for translation based on your settings.

## Features

- Adds a floating translator icon to all text inputs on web pages
- Translates text using AI (via OpenAI API or other compatible providers)
- Configurable source and target languages
- Customizable translation prompt
- Adjustable icon positioning
- Simple popup interface to quickly access settings

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the folder containing the extension files
5. The extension will be installed and the options page will open automatically

## Configuration

Before using the extension, you need to set up your API key and preferences:

1. Get an API key from OpenAI or another compatible AI service
2. Enter your API key in the extension options
3. Configure your preferred source and target languages
4. Customize the translation prompt if needed
5. Save your settings

## Usage

1. Visit any website with text input fields
2. Notice the floating translation icon next to each text input
3. Enter or paste text into an input field
4. Click the translator icon to translate the text
5. The translated text will replace the original content in the input field

## Customize Translation Prompt

You can customize how the AI translates your text by modifying the prompt template in the settings. Use the following placeholders:

- `{source_language}`: Will be replaced with the source language name
- `{target_language}`: Will be replaced with the target language name
- `{text}`: Will be replaced with the text to translate

Example prompt:
```
Translate the following text from {source_language} to {target_language}: {text}
```

## Supported Languages

The extension currently supports the following languages:
- English
- French
- Spanish
- German
- Italian
- Portuguese
- Russian
- Japanese
- Chinese
- Korean
- Arabic

More languages can be added by modifying the code.

## Files and Structure

- `manifest.json`: Extension configuration and permissions
- `options.html/js/css`: Settings page for the extension
- `popup.html/js`: The popup that appears when clicking the extension icon
- `content.js/css`: Scripts that inject and manage the translator icon on web pages
- `background.js`: Handles extension installation and events

## Permissions

This extension requires the following permissions:
- `storage`: To save your settings
- `activeTab`: To interact with the content of your current tab

## Notes

- The extension requires an API key from OpenAI or another compatible AI service
- Translation quality depends on the AI service used
- Be aware of any usage limits or costs associated with your API key