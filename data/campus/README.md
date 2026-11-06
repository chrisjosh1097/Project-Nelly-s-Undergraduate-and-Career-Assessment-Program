# Campus catalog

`catalog.json` lists Indonesian campuses and their D3/D4/S1 programs. It is display data only: it never affects scores, ranks or eligibility.

## Sources

| Source | What we take | Licence / permission |
| --- | --- | --- |
| [joearton/perguruan-tinggi](https://github.com/joearton/perguruan-tinggi) `program-studi.csv` (2022 crawl of PDDikti) | Program name, campus, degree, LLDikti region. Covers private campuses and academies. | No licence file. The author gave the project owner permission to use it. |
| SNBTKU dataset by Ibnul Habib ([prodhokter/dataset-perguruan-tinggi-indonesia](https://github.com/prodhokter/dataset-perguruan-tinggi-indonesia), API `api.ibnuhabib.web.id`) | PTN programs from SNPMB 2024: province, quota, applicants. | MIT |

**Never shown:** passing grade, min/max score or classification from SNBTKU. These are unofficial estimates.

The source line shown in the app:

> Sumber: kompilasi PDDikti (joearton, 2022) dan data SNPMB 2024 (Ibnul Habib, MIT). Data bisa berubah — cek sumber resmi.

## Rebuilding

```bash
npm run import:campus            # downloads into .superpowers/sdd/2026-11-02-campus-data (gitignored)
npm run import:campus -- --raw <dir>
```

The script:
- keeps only D3, D4 and S1;
- merges duplicates by campus (case, spaces and punctuation ignored) plus program and degree, preferring SNPMB rows;
- throttles the SNBTKU API to 1 request per second.

Review the diff before committing. The app reads only this file and never calls the sources at runtime.

## Known gaps

- Joearton rows have no city or province. Private campuses are located only by LLDikti region.
- Some state campuses outside SNPMB (for example IAIN) have no province.
- Official maritime and service schools (sekolah kedinasan) may be missing. The UI says so for maritime routes.
- 2022 data may include closed or renamed programs. The UI always links to PDDikti for checking.
