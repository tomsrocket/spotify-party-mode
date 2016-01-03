# Spotify party mode


This is the sourcecode of the application that runs on http://partyspot.cc

## Description

It creates a "party mode" for spotify. Users can request songs and vote for them.

Designed to run on a single "party music terminal".
Implemented in pure Javascript / HTML.
Requires the Spotify application to run on the same computer.

It queries the spotify web REST JSON API to implement the song search feature.

## Installation / how to run
Run a webserver from the main directory and then open the index.html file via a web browser on a machine that has the spotify client installed.


## Notes
With some versions of spotify this doesn't work because they disabled the autoplay-url feature. See [the spotify community post](https://community.spotify.com/t5/Help-Desktop-Linux-Windows-Web/New-update-not-allowing-autoplay-from-URI/td-p/1045489) for more details.
