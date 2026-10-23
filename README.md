# Kalastuspro

Kalastuspro on Expo-pohjainen React Native -sovellus kalastajille. Sovellus näyttää
paikkakohtaisia säätietoja, ilmanpaineen kehityksen ja suuntaa-antavan
syönti-indeksin. Lisäksi käyttäjä voi tallentaa kalastuspaikkoja kartalle sekä
pitää kuvallista saalispäiväkirjaa.

## Teknologiat

- Expo SDK 57
- React Native 0.86
- TypeScript
- Expo Router
- Open-Meteo-säärajapinta
- `expo-location`
- `react-native-maps`
- `expo-sqlite`
- `expo-image-picker`
- `expo-file-system`
- `react-native-svg`
- Jest ja `jest-expo`

## Käynnistäminen

### Vaatimukset

- Node.js LTS
- npm
- iPhone, Android-laite tai Expo Go
- iPhone-testausta varten tietokone ja puhelin yleensä samaan Wi-Fi-verkkoon

### Asennus

Siirry projektikansioon ja asenna riippuvuudet:

```powershell
cd C:\Users\Ghost\Desktop\Mobiiliohjelmointi\kalastajapro
npm install
```

### Kehityspalvelin

```powershell
npx expo start -c
```

Skannaa terminaalissa näkyvä QR-koodi Expo Go -sovelluksella. Jos lähiverkkoyhteys
ei toimi, kokeile tunnel-yhteyttä:

```powershell
npx expo start --tunnel
```

Muita käynnistyskomentoja:

```powershell
npm run android
npm run ios
npm run web
```

## Ominaisuudet

### Sää

- Sää haetaan Open-Meteosta ilman tämän sovelluksen omaa API-avainta.
- Käyttäjän sijaintia käytetään, jos sijaintilupa annetaan.
- Jos lupa evätään tai sijaintia ei saada, käytetään Helsingin oletussijaintia.
- Näytetään lämpötila, ilmanpaine, tuuli metreinä sekunnissa, tuulensuunta ja säätilanne.
- Ilmanpaineen viimeisen 24 tunnin kehitys näytetään kuvaajana.
- Syönti-indeksi on suuntaa-antava heuristinen arvio, ei saalistakuu.

### Kartta

- Kartalla näkyy käyttäjän sijainti luvan jälkeen.
- Karttaa napauttamalla voi lisätä kalastuspaikan.
- Tallennetut paikat näkyvät eri kuvakkeella kuin uuden paikan valinta.
- Kalastuspaikat tallennetaan paikalliseen SQLite-tietokantaan.

### Saalispäiväkirja

- Saaliin voi lisätä lajin, painon, päivämäärän, paikan ja kuvan.
- Tallennetun karttapaikan voi valita saalislomakkeessa.
- Saaliita voi muokata ja poistaa.
- Saaliskuva kopioidaan sovelluksen omaan tallennustilaan.
- Tilastosivulla näytetään kokonaismäärä, painot, suurin saalis, yleisin laji sekä
  laji- ja paikkakohtaiset määrät.

## Kansiorakenne

```text
app/
  (tabs)/
    index.tsx       # Sää
    two.tsx         # Kartta ja kalastuspaikat
    journal.tsx     # Saalispäiväkirja
  stats.tsx         # Omat tilastot
  privacy.tsx       # Tietoa ja tietosuoja
  _layout.tsx       # Päänavigointi
components/         # Teemaa käyttävät käyttöliittymäkomponentit
constants/          # Keskitettyjä väriarvoja
database/
  database.ts       # SQLite-alustus ja CRUD-operaatiot
services/
  weatherService.ts # Open-Meteo ja syönti-indeksi
  catchStatistics.ts# Tilastojen laskenta
  catchValidation.ts# Saalislomakkeen validointi
assets/             # Kuvakkeet, splash-kuva ja fontit
```

## Tietokanta ja tietosuoja

Saalit ja kalastuspaikat tallennetaan laitteen paikalliseen SQLite-tietokantaan.
Kuvat tallennetaan laitteen sovellustilaan, ja tietoja ei lähetetä tämän projektin
omalle palvelimelle.

Sijaintia käytetään säähaun koordinaatteihin ja kartan käyttäjäsijaintiin.
Open-Meteolle välitetään säähaun koordinaatit, jotta paikkakohtainen sää voidaan
palauttaa. Sovellus ei käytä kameraa tai mikrofonia.

Lisätiedot löytyvät sovelluksen **Tietoa ja tietosuoja** -näkymästä.

## Testaus ja laadunvarmistus

Yksikkötestit:

```powershell
npm test
```

TypeScript-tarkistus:

```powershell
npx tsc --noEmit
```

Lint:

```powershell
npm run lint
```

Expo-konfiguraation tarkistus:

```powershell
npx expo-doctor
npx expo config --type public
```

Ennen esittelyä testaa vähintään:

1. Sijaintiluvan hyväksyminen ja epääminen.
2. Sään lataaminen ja uudelleenlataus.
3. Karttapaikan lisääminen.
4. Saaliin lisääminen kuvalla ja ilman kuvaa.
5. Saaliin muokkaaminen ja poistaminen.
6. Tilastojen päivittyminen.
7. Sovelluksen sulkeminen ja tietojen säilyminen uudelleenkäynnistyksessä.
8. Virheelliset painot ja päivämäärät.

## Esittelydemo

Suositeltu esittelyjärjestys:

1. Näytä sääsivu ja käyttäjän sijaintiin perustuva sää.
2. Näytä ilmanpainekuvaaja ja syönti-indeksi.
3. Avaa kartta ja lisää kalastuspaikka.
4. Avaa saalispäiväkirja ja valitse tallennettu paikka.
5. Lisää saalis kuvan kanssa.
6. Muokkaa saalista.
7. Avaa omat tilastot.
8. Avaa tietosuoja-näkymä.
9. Käynnistä sovellus uudelleen ja osoita, että tiedot säilyvät.

## Tunnetut rajoitukset

- Open-Meteon sää riippuu verkkoyhteydestä.
- Syönti-indeksi on käsin määritelty arvio, ei tieteellisesti validoitu ennuste.
- `react-native-maps` tarvitsee oikean mobiiliympäristön karttatestausta varten.
- Expo SQLite Web -tuki on rajoitetumpi kuin mobiilialustojen SQLite-tuki.
- Kehitysympäristön riippuvuuksien auditointitulokset kannattaa tarkistaa uudelleen
  ennen tuotantobuildia. Expo-version rikkomista aiheuttavaa `npm audit fix --force`
  -komentoa ei pidä käyttää ilman erillistä yhteensopivuustarkistusta.
