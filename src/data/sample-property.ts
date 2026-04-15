/**
 * Sample property specification document for RAG indexing.
 * In production this would come from an API or uploaded document.
 */
export const SAMPLE_PROPERTY_SPEC = `
# 485 Brickell Ave, Unit 3208 — Miami, FL 33131

## Overview
Stunning high-rise luxury condo on the 32nd floor of the iconic Brickell Tower. This 2-bedroom, 2.5-bathroom residence offers breathtaking panoramic views of Biscayne Bay, the Miami skyline, and the Atlantic Ocean. Built in 2019 with premium finishes throughout.

## Property Details
- **Type:** Condominium
- **Bedrooms:** 2
- **Bathrooms:** 2.5
- **Living Area:** 1,450 sq ft
- **Balcony Area:** 180 sq ft
- **Floor:** 32nd
- **Year Built:** 2019
- **Parking:** 1 assigned covered space (Garage Level 2, Spot #208)
- **Storage:** Private storage unit included (Level B1, Unit 32-S)

## Pricing
- **List Price:** $1,250,000
- **Price per Sq Ft:** $862
- **HOA Fee:** $850/month
- **Property Tax (2024):** $12,400/year
- **Special Assessment:** None pending

## Interior Features
- Floor-to-ceiling impact-resistant windows (10 ft ceilings)
- Italian porcelain tile flooring throughout living areas
- European-style open kitchen with waterfall quartz countertops
- Sub-Zero refrigerator, Wolf gas range, Miele dishwasher
- Primary suite with walk-in closet and spa-inspired bathroom
- Dual vanity with backlit mirrors in primary bathroom
- Frameless glass-enclosed rain shower and separate soaking tub
- Smart home system: Lutron lighting, Nest thermostat, Sonos pre-wired
- In-unit full-size washer and dryer (Bosch)
- Custom built-in closet organizers in all bedrooms
- Electric blinds on all windows (remote and app-controlled)

## Building Amenities
- 24/7 concierge and valet parking
- Rooftop infinity pool and sun deck (52nd floor)
- State-of-the-art fitness center (4,000 sq ft) with Peloton bikes
- Resident lounge and co-working space with private meeting rooms
- Children's playroom and outdoor play area
- Spa with sauna, steam room, and treatment rooms
- Private screening room / theater (seats 30)
- Pet grooming station and dog walking area
- Package receiving room with refrigerated lockers
- EV charging stations (4 Tesla Superchargers, 6 Level 2 chargers)

## Location & Neighborhood
- Walk Score: 95 (Walker's Paradise)
- Transit Score: 89 (Excellent Transit)
- Bike Score: 82 (Very Bikeable)
- 0.3 miles to Brickell City Centre shopping complex
- 0.5 miles to Brickell Metrorail station
- 2 miles to Miami Beach (via MacArthur Causeway)
- 8 miles to Miami International Airport (MIA)
- Walking distance to 50+ restaurants, bars, and cafes
- Adjacent to the Miami Riverwalk and Biscayne Bay Trail

## Agent Information
- **Listing Agent:** Sarah Martinez
- **Brokerage:** Compass Real Estate
- **Phone:** (305) 555-0147
- **Email:** sarah.martinez@compass.com
- **License #:** SL3489201

## Virtual Tour
- **Matterport ID:** VtB6EMYs8vp
- **Total Scans:** 42
- **Highlight Reel:** 8 curated viewpoints including bay view, kitchen, primary suite
- **Dollhouse View:** Full 3D model available
- **Floor Plan:** Interactive floor plan with measurements

## HOA Rules & Restrictions
- Pets allowed: 2 pets max, no breed restrictions, 50 lb limit each
- Rentals allowed: Minimum 6-month lease, max 2 leases per year
- Move-in/Move-out: Must schedule with management, weekdays only 9 AM–5 PM
- Renovation requests require board approval (30-day lead time)
- Quiet hours: 10 PM – 8 AM
- Balcony restrictions: No grills, no hanging items on railings
`;

/**
 * Splits a property specification markdown into logical chunks based on
 * section headers (## headings). Each chunk includes the section title
 * for context.
 */
export function chunkPropertySpec(markdown: string): { section: string; content: string }[] {
  const chunks: { section: string; content: string }[] = [];
  const sections = markdown.split(/^## /m).filter((s) => s.trim().length > 0);

  for (const section of sections) {
    const lines = section.trim().split("\n");
    const firstLine = lines[0].trim();

    // Check if this is the top-level heading (# Title) or a ## section
    if (firstLine.startsWith("# ")) {
      // This is the overview section before any ## headers
      const title = firstLine.replace(/^#+\s*/, "");
      const body = lines.slice(1).join("\n").trim();
      if (body.length > 0) {
        chunks.push({ section: `Property: ${title}`, content: body });
      }
    } else {
      // This is a ## section
      const sectionTitle = firstLine;
      const body = lines.slice(1).join("\n").trim();
      if (body.length > 0) {
        chunks.push({ section: sectionTitle, content: `${sectionTitle}\n${body}` });
      }
    }
  }

  return chunks;
}
