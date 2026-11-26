// Editorial relevance runs from 0 (irrelevant) to 3 (best available evidence).
// Display order is shuffled independently of the editorial key.
const dossiers=[
  {tab:'Find the answer', k:1, q:'Where can I borrow a sled after the first snowfall?', cards:[
    [3,'Equipment desk','en','Once the snow settles, the boathouse lends wooden sleds. Bring your library card.','Names the lending desk and what to bring.'],
    [0,'Slope survey','en','The first snowfall covered the sled run from the ridge to the lake.','Describes the run, with no lending location.'],
    [0,'Repair ledger','en','Two sled runners were waxed and returned to their owners.','Records repairs for people who own sleds.'],
    [0,'Loan register','en','Borrow a pair of binoculars at the bird hide until dusk.','Lends different equipment.']]},
  {tab:'Read for meaning', k:1, q:'My mittens are soaked. Where can I dry them while I eat?',cards:[
    [0,'Café menu','en','Hot soup and dry rye crackers are served until four.','Food is available, but there is nowhere to dry clothing in this passage.'],
    [3,'Hut inventory','en','A warming rack for wet gloves stands beside the lunch tables in the birch hut.','Wet gloves, a warming rack and lunch tables answer all three parts.'],
    [1,'Trail notes','en','Walkers hang damp wool on the rail at the lookout. Eating there attracts gulls and is prohibited.','Offers a drying place where eating is prohibited.'],
    [0,'Lost property','en','A pair of blue mittens was found under the dining bench.','Mentions mittens and dining without offering a drying facility.']]},
  {tab:'Rank two',k:2,q:'Can I return loan skates after the rink desk closes? I need the exact drop-off point.',cards:[
    [3,'Closing checklist','en','After closing, slip rented skates into the padded hatch beside the north gate.','Gives both permission and the exact hatch.'],
    [2,'Loan agreement','en','Out-of-hours returns of rented skates are accepted at the rink.','Confirms the policy but omits the drop-off point.'],
    [1,'Desk map','en','During opening hours, return loan skates to the desk inside the north gate.','Right equipment and gate, wrong time and handover point.'],
    [0,'Sharpening log','en','The north gate workshop closes when the rink desk closes.','Workshop hours say nothing about returning skates.']]},
  {tab:'Rank three',k:3,q:'I have a folded bicycle on the last ferry tonight. Which deck should I use, and do I pay extra?',cards:[
    [3,'Night sailing addendum','en','On the final sailing, folded bikes travel on the saloon deck at no extra charge.','Matches the sailing, bike type, deck and fare.'],
    [2,'Fare table','en','A folded bicycle counts as free hand luggage on every ferry, including the last ferry tonight.','Settles the fare for this bike and sailing, but gives no deck.'],
    [1,'Day sailing addendum','en','Before the evening service begins, folded bicycles travel on the saloon deck.','Relevant bike and deck, but the rule only covers daytime.'],
    [0,'Freight circular','en','Motorcycles must use the vehicle deck and pay a supplement on the last ferry.','Motorcycle rules do not establish bicycle rules.'],
    [0,'Saloon menu','en','The saloon deck serves its last coffee before the ferry docks tonight.','Describes refreshments.']]},
  {tab:'Across languages',k:2,q:'Which entrance to the lantern concert has step-free access tonight?',gloss:'uten trapp = without stairs · ingång = entrance · entrée = entrance',cards:[
    [3,'Venue bulletin','nb','I kveld er vestinngangen til lyktkonserten åpen for publikum som trenger adgang uten trapp.','Specifies tonight’s concert, the west entrance and step-free access.','Tonight the west entrance to the lantern concert is open to visitors needing step-free access.'],
    [2,'Booking office','sv','Det finns en stegfri ingång till kvällens lyktkonsert. Fråga en värd vid ankomst.','Confirms step-free access tonight, but omits which entrance.','There is a step-free entrance to tonight’s lantern concert. Ask a host on arrival.'],
    [1,'Building survey','en','The east entrance to the lantern concert hall has step-free access during daytime tours.','Matches the access need but only covers daytime tours.'],
    [0,'Stage crew','fr','L’entrée nord est réservée aux musiciens et à leurs instruments.','A crew entrance gives the audience no access information.','The north entrance is reserved for musicians and their instruments.']]},
  {tab:'Cross-language ranking',k:3,q:'Snow closed the bridge. Where does the replacement bus to the island leave this evening, and when?',gloss:'pont / Brücke = bridge · Ersatzbus = replacement bus · hållplats = bus stop · quai = quay',cards:[
    [3,'Dispatch wire','fr','Ce soir, le pont est fermé à cause de la neige. Le bus de remplacement pour l’île part du vieux quai à 19 h 10.','Gives the diversion, destination, old quay and exact evening departure.','Tonight the bridge is closed by snow. The replacement bus to the island leaves the old quay at 19:10.'],
    [2,'Driver notice','de','Wegen der Brückensperrung fährt der Ersatzbus zur Insel heute Abend am alten Kai ab. Die Abfahrtszeit folgt.','Correct evening diversion and quay. The departure time is still pending.','Because of the bridge closure, tonight’s replacement bus to the island leaves the old quay. Departure time to follow.'],
    [1,'Network bulletin','sv','Bron är stängd på grund av snö. En ersättningsbuss går till ön i kväll. Hållplats och tid meddelas senare.','Confirms tonight’s replacement service but gives neither stop nor time.','The bridge is closed by snow. A replacement bus runs to the island tonight. Stop and time will be announced later.'],
    [0,'Archive timetable','en','When snow closed the bridge last winter, the replacement bus to the island left the school at 19:10.','A previous winter’s timetable cannot establish tonight’s stop or time.'],
    [0,'Harbour radio','nb','I kveld går båten fra den gamle kaia klokka 19.10. Meldingen gjelder bare båtpassasjerer.','Matching quay and time, but this announcement explicitly applies only to boat passengers.','Tonight the boat leaves the old quay at 19:10. This announcement applies only to boat passengers.']]}
];
