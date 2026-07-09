import Navbar from "@/components/Navbar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const rules = [
  {
    category: "Generelle Regler",
    rules: [
      "Respektér alle spillere og staff medlemmer.",
      "Ingen form for hacking, modding eller exploiting er tilladt.",
      "Brug af bugs til egen fordel er forbudt – rapportér dem i stedet.",
      "Ingen reklame for andre servere eller communities.",
      "Brug dansk i alle in-game kommunikationer.",
      "Du skal have en fungerende mikrofon for at spille på serveren.",
      "Alt indhold skal overholde Discord og FiveM's Terms of Service.",
      "Staff har altid det sidste ord – misbrug af systemet medfører ban.",
    ],
  },
  {
    category: "Roleplay Regler",
    rules: [
      "Du skal altid være i karakter når du er på serveren.",
      "Random Deathmatch (RDM) er strengt forbudt.",
      "Vehicle Deathmatch (VDM) er strengt forbudt.",
      "Fear RP skal overholdes – værdsæt dit liv.",
      "Metagaming er ikke tilladt – brug kun information din karakter kender.",
      "Powergaming er forbudt – giv andre spillere en fair chance.",
      "New Life Rule (NLR) – efter du dør, glemmer din karakter alt fra situationen.",
      "Du må ikke bryde ud af RP uden staffs tilladelse.",
      "Fail RP er forbudt – opfør dig realistisk i alle situationer.",
      "Korruption som politi/EMS kræver forudgående godkendelse fra staff.",
    ],
  },
  {
    category: "Kommunikation",
    rules: [
      "Out-of-character (OOC) chat skal holdes til et minimum.",
      "Ingen toksisk opførsel, chikane eller diskrimination.",
      "Staff beslutninger er endelige – diskutér dem via tickets.",
      "Brug /ooc kun til vigtige beskeder – spam er ikke tilladt.",
      "Ingen earrape eller soundboards i voice chat.",
    ],
  },
  {
    category: "Kriminalitet & Bander",
    rules: [
      "Gidseltagning kræver en gyldig RP-grund.",
      "Cop-baiting er ikke tilladt.",
      "Alle kriminelle handlinger skal have en RP-baggrund.",
      "Bandeområder skal respekteres – random skyderi er ikke tilladt.",
      "Du må ikke røve den samme person inden for 30 minutter.",
      "Bankrøverier kræver minimum 4 betjente online.",
      "Scamming er tilladt in-RP, men ikke med rigtige penge eller donationer.",
    ],
  },
  {
    category: "Køretøjer & Kørsel",
    rules: [
      "Urealistisk kørsel (f.eks. off-road med sportsvogne) er forbudt.",
      "Du må ikke bruge køretøjer som våben (VDM).",
      "Pit maneuvers er kun tilladt for politi under aktive jagter.",
      "Helikoptere og fly må kun bruges med gyldig licens i RP.",
      "Parkér køretøjer realistisk – blokering af vigtige områder er ikke tilladt.",
    ],
  },
  {
    category: "Jobs & Økonomi (ESX)",
    rules: [
      "Misbrug af job-funktioner er strengt forbudt.",
      "Deling af penge eller items via exploits medfører permanent ban.",
      "AFK-farming af jobs er ikke tilladt.",
      "Du må ikke have mere end 2 aktive karakterer med jobs samtidig.",
      "Overførsel af penge/items mellem egne karakterer er forbudt.",
      "Dirty money skal hvidvaskes – brug af dirty money i lovlige butikker er forbudt.",
      "Misbrug af /me, /do eller andre kommandoer er ikke tilladt.",
    ],
  },
  {
    category: "EMS & Politi Regler",
    rules: [
      "EMS er neutrale – de behandler alle uanset situation.",
      "Du må ikke skyde eller tage EMS som gidsel uden god RP-grund.",
      "Politi skal følge deres SOP (Standard Operating Procedures).",
      "Korruption i politiet kræver godkendelse fra ledelsen.",
      "Du skal respektere en /revive fra EMS og fortsætte RP derefter.",
      "Når du er nede (downed), må du ikke give information om hvem der skød dig.",
    ],
  },
];

const Rules = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-semibold text-center mb-4 text-foreground">
            Server Regler
          </h1>
          <p className="text-muted-foreground text-center mb-12">
            Læs og forstå reglerne inden du tilslutter serveren.
          </p>

          <Accordion type="multiple" className="space-y-3">
            {rules.map((section, i) => (
              <AccordionItem
                key={i}
                value={`section-${i}`}
                className="border border-border rounded-lg bg-card px-4"
              >
                <AccordionTrigger className="text-base font-medium text-foreground hover:no-underline">
                  {section.category}
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2">
                    {section.rules.map((rule, j) => (
                      <li key={j} className="flex items-start gap-3 text-muted-foreground text-sm">
                        <span className="text-foreground/60 mt-0.5">{j + 1}.</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
      <footer className="py-8 text-center text-muted-foreground text-sm font-body border-t border-border/50">
        <p>© 2026 ZenithRP. Alle rettigheder forbeholdes.</p>
      </footer>
    </div>
  );
};

export default Rules;
