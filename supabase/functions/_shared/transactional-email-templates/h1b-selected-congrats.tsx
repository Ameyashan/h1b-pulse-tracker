import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "H1B Pulse"

const H1bSelectedCongratsEmail = () => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Congratulations on your H-1B selection! Check out what's next.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={heroSection}>
          <Heading style={h1}>
            Congratulations!
          </Heading>
          <Text style={heroText}>
            Your H-1B petition has been selected in the FY2026 lottery!
          </Text>
        </Section>

        <Hr style={divider} />

        <Text style={text}>
          This is a huge milestone and you're one step closer to securing your H-1B visa. We know the process ahead can feel overwhelming, so we've put together a comprehensive guide to help you navigate what comes next.
        </Text>

        <Section style={featureBox}>
          <Heading style={h2}>New: "Next Steps" Tab</Heading>
          <Text style={featureText}>
            We've added a brand new <strong>Next Steps</strong> tab to H1B Pulse with a complete roadmap covering:
          </Text>
          <Text style={listItem}>Document preparation checklist</Text>
          <Text style={listItem}>Key filing deadlines and timeline</Text>
          <Text style={listItem}>Understanding fees and premium processing</Text>
          <Text style={listItem}>RFE preparation tips</Text>
          <Text style={listItem}>What to expect after filing</Text>
        </Section>

        <Section style={ctaSection}>
          <Button style={ctaButton} href="https://h1bpulse.com/next-steps">
            View Your Next Steps →
          </Button>
        </Section>

        <Text style={text}>
          Stay informed, stay prepared, and best of luck with your petition filing!
        </Text>

        <Text style={footer}>
          The {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: H1bSelectedCongratsEmail,
  subject: 'Congrats on your H-1B selection! Here\'s what to do next',
  displayName: 'H-1B Selection Congratulations',
  previewData: {},
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '560px', margin: '0 auto' }
const heroSection = { textAlign: 'center' as const, padding: '24px 0 16px' }
const emoji = { fontSize: '48px', margin: '0 0 8px', lineHeight: '1' }
const h1 = { fontSize: '26px', fontWeight: '700' as const, color: '#1a1a2e', margin: '0 0 8px', lineHeight: '1.3' }
const heroText = { fontSize: '16px', color: '#4a5568', margin: '0', lineHeight: '1.5' }
const divider = { borderColor: '#e2e8f0', margin: '24px 0' }
const text = { fontSize: '15px', color: '#2d3748', lineHeight: '1.6', margin: '0 0 16px' }
const h2 = { fontSize: '18px', fontWeight: '600' as const, color: '#1a1a2e', margin: '0 0 12px' }
const featureBox = { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '20px', margin: '0 0 24px' }
const featureText = { fontSize: '14px', color: '#2d3748', lineHeight: '1.5', margin: '0 0 12px' }
const listItem = { fontSize: '14px', color: '#2d3748', lineHeight: '1.8', margin: '0', paddingLeft: '4px' }
const ctaSection = { textAlign: 'center' as const, margin: '8px 0 24px' }
const ctaButton = { backgroundColor: '#22c55e', color: '#ffffff', fontSize: '16px', fontWeight: '600' as const, padding: '14px 32px', borderRadius: '8px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '13px', color: '#94a3b8', margin: '24px 0 0', lineHeight: '1.5' }
