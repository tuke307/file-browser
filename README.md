# HTML5-Dateibrowser

## Installation
### WebService
Zunächst muss die `WebService.zip` an einem beliebigen Ort entpackt und mithilfe von Docker gehostet werden. Mehr dazu in `api.pdf`.

### Dateibrowser (HTML, JavaScript, CSS)
In der `config.js` muss der Port der Webservice API notiert werden.
Danach kann die Website mit einem beliebigen Hosting-Tool zum laufen gebracht werden.
Für dieses Projekt wurde dabei der [static-server](https://www.npmjs.com/package/static-server) benutzt.
 
## Unterstützte browser
Untersützt werden jegliche Browser, die HTML5 unterstützen. Einige Beispiele währen dabei Google Chrome, Firefox, Microsoft Edge oder Opera.

## Laufzeitumgebung
Das Projekt wurde ausschließlich in JavaScript, HTML und CSS entwickelt.

## Struktur
Die Struktur des Projektes ist wie folgt aufgebaut:
* `config.js` - Konfigurationsdatei für die API
* `elements.js` - JavaScript-Datei, die die HTML-Elemente abruft
* `api.js` - JavaScript-Datei, die die API-Anfragen an den WebService sendet
* `events.js` - JavaScript-Datei, die die Events der HTML-Elemente behandelt
* `authentication.js` - JavaScript-Datei, die die Authentifizierung behandelt
* `filemanager.js` - JavaScript-Datei, die die Dateiverwaltung behandelt
* `utils.js` - JavaScript-Datei, die Hilfsfunktionen enthält
* `style.css` - CSS-Datei, die das Design der Website festlegt
* `index.html` - Startseite des Dateibrowsers


## Sicherheit 
Die Authentifizierung erfolgt über Nutername und Passwort. Die `login(username, password)` Funktion sendet dabei eine Anfrage an den Webservice. Der Token wird dann in den Cookies gespeichert und bei jeder weiteren Anfrage an den Webservice mitgesendet. Der Token ist dabei 500 Millisekunden gültig.

Der Logout erfolgt über die `logout()` Funktion, die den Token aus den Cookies löscht.


## Darstellung
Die Anpassung an das Browserfenster erfolgt über CSS. Die Website ist dabei für die Darstellung auf einem Desktop-Browser optimiert.

Die Usability ist dabei auf die Bedienung mit der Maus ausgelegt. Die Bedienung mit der Tastatur ist nicht möglich.

Die Fehlererkennung erfolgt dabei auf zwei Ebenen. Sobald Fehler auftreten, bei den WebService Aufrufen, werden diese in der Konsole des Browsers ausgegeben.
In den Funktionen die den Webservice Aufruf machen, wird der Status Code abgefragt und Fehlermeldungen in einem Pop-Up Fenster angezeigt.

Die Verzeichnisse und Dateitypen werden dabei in einer Tabelle dargestellt. Die spezifischen Funktionen werden über Dateiendung erkannt und festgelegt.


## Navigation 
Die Navigation erfolgt über die `currentPath` Variable. Dort wird der derzeitige Pfad angezeigt.

Die Navigation in einen spezifischen Ordner erfolgt über die `goToPath(name)` Funktion.

Die Navigation zurück, erfolgt uber die  `goBack()` Funktion.

## Datei-Handling
Die Datei Ansicht wird über die `viewFile(name)` Funktion gehandhabt. Je nacht Dateityp wird das dazugehörige HTML-Viewer-Element angezeigt.


## Verzeichnis-Handling
Verzeichnis löschen mit `deleteItem(item)` Funktion.

Verzeichnis erstellen mit `createDirectory(name)` Funktion.


## Datenschutz
Die Google Fonts wurden lokal eingebunden und sind damit DSGVO konform.