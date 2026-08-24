export interface MonthDay {
  day: number;
  month: number;
}

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

const CALENDAR: readonly (readonly string[])[][] = [
  [
    [],
    ["Karina"],
    ["Radmila"],
    ["Diana"],
    ["Dalimil"],
    [],
    ["Vilma"],
    ["Čestmír"],
    ["Vladan"],
    ["Břetislav"],
    ["Bohdana"],
    ["Pravoslav"],
    ["Edita"],
    ["Radovan"],
    ["Alice"],
    ["Ctirad"],
    ["Drahoslav"],
    ["Vladislav"],
    ["Doubravka"],
    ["Ilona"],
    ["Běla"],
    ["Slavomír"],
    ["Zdeněk"],
    ["Milena"],
    ["Miloš"],
    ["Zora"],
    ["Ingrid"],
    ["Otýlie"],
    ["Zdislava"],
    ["Robin"],
    ["Marika"],
  ],
  [
    ["Hynek"],
    ["Nela"],
    ["Blažej"],
    ["Jarmila"],
    ["Dobromila"],
    ["Vanda"],
    ["Veronika"],
    ["Milada"],
    ["Apolena"],
    ["Mojmír"],
    ["Božena"],
    ["Slavěna"],
    ["Věnceslav"],
    ["Valentýn"],
    ["Jiřina"],
    ["Ljuba"],
    ["Miloslava"],
    ["Gizela"],
    ["Patrik"],
    ["Oldřich"],
    ["Lenka"],
    ["Petr"],
    ["Svatopluk"],
    ["Matěj"],
    ["Liliana"],
    ["Dorota"],
    ["Alexandr"],
    ["Lumír"],
    ["Horymír"],
  ],
  [
    ["Bedřich"],
    ["Anežka"],
    ["Kamil"],
    ["Stela"],
    ["Kazimír"],
    ["Miroslav"],
    ["Tomáš"],
    ["Gabriela"],
    ["Františka"],
    ["Viktorie"],
    ["Anděla"],
    ["Řehoř"],
    ["Růžena"],
    ["Rút", "Matylda"],
    ["Ida"],
    ["Elena", "Herbert"],
    ["Vlastimil"],
    ["Eduard"],
    ["Josef"],
    ["Světlana"],
    ["Radek"],
    ["Leona"],
    ["Ivona"],
    ["Gabriel"],
    ["Marián"],
    ["Emanuel"],
    ["Dita"],
    ["Soňa"],
    ["Taťána"],
    ["Arnošt"],
    ["Kvido"],
  ],
  [
    ["Hugo"],
    ["Erika"],
    ["Richard"],
    ["Ivana"],
    ["Miroslava"],
    ["Vendula"],
    ["Heřman", "Hermína"],
    ["Ema"],
    ["Dušan"],
    ["Darja"],
    ["Izabela"],
    ["Julius"],
    ["Aleš"],
    ["Vincenc"],
    ["Anastázie"],
    ["Irena"],
    ["Rudolf"],
    ["Valérie"],
    ["Rostislav"],
    ["Marcela"],
    ["Alexandra"],
    ["Evženie"],
    ["Vojtěch"],
    ["Jiří"],
    ["Marek"],
    ["Oto"],
    ["Jaroslav"],
    ["Vlastislav"],
    ["Robert"],
    ["Blahoslav"],
  ],
  [
    [],
    ["Zikmund"],
    ["Alexej"],
    ["Květoslav"],
    ["Klaudie"],
    ["Radoslav"],
    ["Stanislav"],
    [],
    ["Ctibor"],
    ["Blažena"],
    ["Svatava"],
    ["Pankrác"],
    ["Servác"],
    ["Bonifác"],
    ["Žofie"],
    ["Přemysl"],
    ["Aneta"],
    ["Nataša"],
    ["Ivo"],
    ["Zbyšek"],
    ["Monika"],
    ["Emil"],
    ["Vladimír"],
    ["Jana"],
    ["Viola"],
    ["Filip"],
    ["Valdemar"],
    ["Vilém"],
    ["Maxmilián"],
    ["Ferdinand"],
    ["Kamila"],
  ],
  [
    ["Laura"],
    ["Jarmil"],
    ["Tamara"],
    ["Dalibor"],
    ["Dobroslav"],
    ["Norbert"],
    ["Iveta", "Slavoj"],
    ["Medard"],
    ["Stanislava"],
    ["Gita"],
    ["Bruno"],
    ["Antonie"],
    ["Antonín"],
    ["Roland"],
    ["Vít"],
    ["Zbyněk"],
    ["Adolf"],
    ["Milan"],
    ["Leoš"],
    ["Květa"],
    ["Alois"],
    ["Pavla"],
    ["Zdeňka"],
    ["Jan"],
    ["Ivan"],
    ["Adriana"],
    ["Ladislav"],
    ["Lubomír"],
    ["Petr", "Pavel"],
    ["Šárka"],
  ],
  [
    ["Jaroslava"],
    ["Patricie"],
    ["Radomír"],
    ["Prokop"],
    ["Cyril", "Metoděj"],
    [],
    ["Bohuslava"],
    ["Nora"],
    ["Drahoslava"],
    ["Libuše", "Amálie"],
    ["Olga"],
    ["Bořek"],
    ["Markéta"],
    ["Karolína"],
    ["Jindřich"],
    ["Luboš"],
    ["Martina"],
    ["Drahomíra"],
    ["Čeněk"],
    ["Ilja"],
    ["Vítězslav"],
    ["Magdaléna"],
    ["Libor"],
    ["Kristýna"],
    ["Jakub"],
    ["Anna"],
    ["Věroslav"],
    ["Viktor"],
    ["Marta"],
    ["Bořivoj"],
    ["Ignác"],
  ],
  [
    ["Oskar"],
    ["Gustav"],
    ["Miluše"],
    ["Dominik"],
    ["Kristián"],
    ["Oldřiška"],
    ["Lada"],
    ["Soběslav"],
    ["Roman"],
    ["Vavřinec"],
    ["Zuzana"],
    ["Klára"],
    ["Alena"],
    ["Alan"],
    ["Hana"],
    ["Jáchym"],
    ["Petra"],
    ["Helena"],
    ["Ludvík"],
    ["Bernard"],
    ["Johana"],
    ["Bohuslav"],
    ["Sandra"],
    ["Bartoloměj"],
    ["Radim"],
    ["Luděk"],
    ["Otakar"],
    ["Augustýn"],
    ["Evelína"],
    ["Vladěna"],
    ["Pavlína"],
  ],
  [
    ["Linda", "Samuel"],
    ["Adéla"],
    ["Bronislav"],
    ["Jindřiška"],
    ["Boris"],
    ["Boleslav"],
    ["Regína"],
    ["Mariana"],
    ["Daniela"],
    ["Irma"],
    ["Denisa"],
    ["Marie"],
    ["Lubor"],
    ["Radka"],
    ["Jolana"],
    ["Ludmila"],
    ["Naděžda"],
    ["Kryštof"],
    ["Zita"],
    ["Oleg"],
    ["Matouš"],
    ["Darina"],
    ["Berta"],
    ["Jaromír"],
    ["Zlata"],
    ["Andrea"],
    ["Jonáš"],
    ["Václav"],
    ["Michal"],
    ["Jeroným"],
  ],
  [
    ["Igor"],
    ["Olívie", "Oliver"],
    ["Bohumil"],
    ["František"],
    ["Eliška"],
    ["Hanuš"],
    ["Justýna"],
    ["Věra"],
    ["Štefan", "Sára"],
    ["Marina"],
    ["Andrej"],
    ["Marcel"],
    ["Renáta"],
    ["Agáta"],
    ["Tereza"],
    ["Havel"],
    ["Hedvika"],
    ["Lukáš"],
    ["Michaela"],
    ["Vendelín"],
    ["Brigita"],
    ["Sabina"],
    ["Teodor"],
    ["Nina"],
    ["Beáta"],
    ["Erik"],
    ["Šarlota", "Zoe"],
    [],
    ["Silvie"],
    ["Tadeáš"],
    ["Štěpánka"],
  ],
  [
    ["Felix"],
    [],
    ["Hubert"],
    ["Karel"],
    ["Miriam"],
    ["Liběna"],
    ["Saskie"],
    ["Bohumír"],
    ["Bohdan"],
    ["Evžen"],
    ["Martin"],
    ["Benedikt"],
    ["Tibor"],
    ["Sáva"],
    ["Leopold"],
    ["Otmar"],
    ["Mahulena"],
    ["Romana"],
    ["Alžběta"],
    ["Nikola"],
    ["Albert"],
    ["Cecílie"],
    ["Klement"],
    ["Emílie"],
    ["Kateřina"],
    ["Artur"],
    ["Xenie"],
    ["René"],
    ["Zina"],
    ["Ondřej"],
  ],
  [
    ["Iva"],
    ["Blanka"],
    ["Svatoslav"],
    ["Barbora"],
    ["Jitka"],
    ["Mikuláš"],
    ["Ambrož", "Benjamín"],
    ["Květoslava"],
    ["Vratislav"],
    ["Julie"],
    ["Dana"],
    ["Simona"],
    ["Lucie"],
    ["Lýdie"],
    ["Radana"],
    ["Albína"],
    ["Daniel"],
    ["Miloslav"],
    ["Ester"],
    ["Dagmar"],
    ["Natálie"],
    ["Šimon"],
    ["Vlasta"],
    ["Adam", "Eva"],
    [],
    ["Štěpán"],
    ["Žaneta"],
    ["Bohumila"],
    ["Judita"],
    ["David"],
    ["Silvestr"],
  ],
];

interface NameEntry {
  canonicalName: string;
  dates: MonthDay[];
}

export function normalizeName(name: string): string {
  return name
    .trim()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("cs-CZ");
}

const NAME_INDEX = new Map<string, NameEntry>();

for (const [monthIndex, month] of CALENDAR.entries()) {
  for (const [dayIndex, names] of month.entries()) {
    for (const canonicalName of names) {
      const normalizedName = normalizeName(canonicalName);
      const entry = NAME_INDEX.get(normalizedName);
      const date = { day: dayIndex + 1, month: monthIndex + 1 };

      if (entry === undefined) {
        NAME_INDEX.set(normalizedName, { canonicalName, dates: [date] });
      } else {
        entry.dates.push(date);
      }
    }
  }
}

export function namesForDate(day: number, month: number): string[] | null {
  if (
    !Number.isInteger(day) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > DAYS_IN_MONTH.length ||
    day < 1 ||
    day > DAYS_IN_MONTH[month - 1]
  ) {
    return null;
  }

  return [...CALENDAR[month - 1][day - 1]];
}

export function datesForName(name: string): MonthDay[] {
  const entry = NAME_INDEX.get(normalizeName(name));
  return entry?.dates.map((date) => ({ ...date })) ?? [];
}

export function canonicalNameFor(name: string): string | null {
  return NAME_INDEX.get(normalizeName(name))?.canonicalName ?? null;
}

export function parseDate(value: string): MonthDay | null {
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const czechMatch = /^(\d{1,2})\. ?(\d{1,2})(?:\. ?(\d{4})|\.)?$/.exec(
    value,
  );

  const day = Number(isoMatch?.[3] ?? czechMatch?.[1]);
  const month = Number(isoMatch?.[2] ?? czechMatch?.[2]);
  const yearText = isoMatch?.[1] ?? czechMatch?.[3];

  if (
    (isoMatch === null && czechMatch === null) ||
    namesForDate(day, month) === null
  ) {
    return null;
  }

  if (day === 29 && month === 2 && yearText !== undefined) {
    const year = Number(yearText);
    const isLeapYear =
      year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

    if (!isLeapYear) {
      return null;
    }
  }

  return { day, month };
}
