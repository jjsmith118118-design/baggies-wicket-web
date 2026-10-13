// Season and age groups live in api/_lib/rules.ts so the payment
// server uses exactly the same rules as the website.
export { CURRENT_SEASON, AGE_GROUPS, ADULT } from "../../api/_lib/rules";

// Existing kit supplier store (full playing kit is ordered here).
export const KIT_STORE_URL = "https://www.serioussport.co.uk/teamstores/kingston-bagpuize";

export const CLUB_EMAIL = "baggiescricket@gmail.com";

// Public contact email shown on the website (footer, contact page, juniors page).
export const CONTACT_EMAIL = "baggiescricket@gmail.com";

export const GROUND_ADDRESS = ["The Sportsfield", "Abingdon Road (A415)", "Kingston Bagpuize, Abingdon", "OX13 5GD"];
export const DIRECTIONS_URL = "https://www.google.com/maps/dir/?api=1&destination=Kingston+Bagpuize+Cricket+Club+OX13+5GD";

// Junior coordinator – "Ask a question" emails go here, with CONTACT_EMAIL in CC.
export const JUNIOR_EMAIL = "kbccjuniorcoordinator@gmail.com";
