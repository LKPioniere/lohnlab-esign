# LohnLab eSign

Digitale Signatur und Dokumentenworkflows – von der **LohnLab Software GmbH** angepasst und erweitert für **interne Zwecke** und den Einsatz bei **Kunden**; selbst gehostet und an eure Prozesse anbindbar.

---

## Lizenz und Herkunft

Dieses Programm ist eine **bearbeitete Version** der Open-Source-Software **Documenso** und steht wie das Original unter der **[GNU Affero General Public License v3.0](./LICENSE)** (AGPL-3.0). Den Quellcode des zugrunde liegenden Projekts findet ihr hier: **[https://github.com/documenso/documenso](https://github.com/documenso/documenso)**.  
Wenn ihr LohnLab eSign über ein Netzwerk bereitstellt, gelten die Pflichten der AGPL (u. a. Bereitstellung des Quellcodes der laufenden Version gegenüber den Nutzenden) – siehe Lizenztext.

---

## Über LohnLab eSign

**LohnLab eSign** wird von der **LohnLab Software GmbH** auf Basis des oben genannten Upstreams **angepasst und erweitert** – für den **internen Betrieb** der Gesellschaft sowie für **kundenbezogene** Einsatzszenarien. Schwerpunkte:

- **Branding** und Nutzung im Kontext von LohnLab und Kundenprojekten  
- **Zusätzliche Formate:** Upload von DOC, DOCX, ODT und RTF mit serverseitiger PDF-Konvertierung (LibreOffice)  
- **Weitere Erweiterungen** für interne Abläufe und kundenspezifische Anforderungen

## Technologie-Stack

| Bereich | Technologie |
|--------|-------------|
| Sprache | [TypeScript](https://www.typescriptlang.org/) |
| Web-Framework | [React Router](https://reactrouter.com/) (Remix-Ökosystem) |
| Datenbank / ORM | [Prisma](https://www.prisma.io/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) |
| API | [tRPC](https://trpc.io/) |
| E-Mail | [react-email](https://react.email/) |
| PDF | [React-PDF](https://github.com/wojtekmaj/react-pdf), [PDF-Lib](https://github.com/Hopding/pdf-lib), `@documenso/pdf-sign` |
| Zahlungen | [Stripe](https://stripe.com/) |

## Lokale Entwicklung

### Voraussetzungen

- **Node.js** v22 oder höher  
- **PostgreSQL**  
- optional **Docker** / Docker Compose (für `npm run dx`)

### Schnellstart (mit Docker für DB und Mail)

1. Repository klonen (eure Git-URL einsetzen):

   ```sh
   git clone <URL-eures-lohnlab-esign-Repos>
   cd lohnlab-esign
   ```

2. **Umgebung:** `.env` aus Vorlage erstellen, z. B. `cp .env.example .env` und Werte anpassen.

3. **Dienste starten:** im Projektroot `npm run dx` – startet u. a. PostgreSQL und einen lokalen Mail-Server (Inbucket).

4. **App starten:** `npm run dev`

   Alternativ (ein Befehl, wo konfiguriert): `npm run d`

### Wichtige Endpunkte (Standard)

| Dienst | URL |
|--------|-----|
| Anwendung | http://localhost:3000 |
| E-Mail (Inbucket, bei `dx`) | http://localhost:9000 |
| PostgreSQL (bei `dx`) | Port **54320** (je nach `.env`) |

### Manuelles Setup (ohne `dx`)

1. `npm i` im Projektroot  
2. `.env` aus `.env.example` ableiten und u. a. setzen:  
   `NEXTAUTH_SECRET`, `NEXT_PUBLIC_WEBAPP_URL`, `NEXT_PRIVATE_DATABASE_URL`, `NEXT_PRIVATE_DIRECT_DATABASE_URL`, `NEXT_PRIVATE_SMTP_FROM_NAME`, `NEXT_PRIVATE_SMTP_FROM_ADDRESS`  
3. Schema: `npm run prisma:migrate-dev`  
4. Übersetzungen: `npm run translate:compile`  
5. Entwicklung: `npm run dev`  
6. Optional: `npm run prisma:generate` nach Installation oder Schema-Änderungen  
7. Optional: Testdaten – `npm run prisma:seed -w @documenso/prisma`  
8. Optional: eigenes Signaturzertifikat – siehe [SIGNING.md](./SIGNING.md)

### Umgebungsvariablen in npm-Skripten

Skripte, die `.env` / `.env.local` brauchen, über das Root-Skript ausführen:

```sh
npm run with:env -- <befehl>
```

Beispiel: `npm run with:env -- npx <tool>`

## Docker und Betrieb

Details zur Container-Konfiguration: **[docker/README.md](./docker/README.md)**.  
Images und öffentliche Deploy-Vorlagen im Netz beziehen sich oft noch auf das Upstream-Repository – für LohnLab eSign müsst ihr Registry-URLs, Umgebungsvariablen und Build-Kontext auf **euer** Repo bzw. eure Images anpassen.

### Start der gebauten App (Beispiel)

Nach Build und Migrationen typischerweise aus dem Remix-App-Verzeichnis, z. B.:

```sh
cd apps/remix
npm run start
```

Port und Host (z. B. IPv6 `-H ::`) nach eurer Infrastruktur wählen.

## Fehlerbehebung

### Keine E-Mails im Schnellstart

Mit `npm run dx` landet ausgehende Mail im **Inbucket** (Weboberfläche meist http://localhost:9000, SMTP je nach `.env`).

### IPv6

Startbefehl ggf. mit Host-Binding für IPv6 erweitern (siehe eure Container- oder Process-Manager-Dokumentation).

## Kontakt

**LohnLab Software GmbH** – bei Fragen zum Betrieb, zu Anpassungen oder zur Nutzung für Kunden wendet euch an die zuständigen Ansprechpartner der Gesellschaft.

---

*LohnLab eSign – LohnLab Software GmbH*
