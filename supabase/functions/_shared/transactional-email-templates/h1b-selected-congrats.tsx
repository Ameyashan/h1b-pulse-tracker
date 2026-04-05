import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "H1B Pulse"
const PETITION_URL = "https://h1bpulse.com/petition-tracker?utm_source=email&utm_medium=selected&utm_campaign=congrats"
const DISCORD_URL = "https://discord.gg/NkFBZqF3"

const H1bSelectedCongratsEmail = () => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your H-1B was selected! Here's what comes next.</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={header}>
          <Text style={logoArea}>
            <span style={logoDot}>●</span>{' '}
            <span style={logoText}>H1B Pulse</span>
          </Text>
          <Text style={confettiEmoji}>🎉</Text>
          <Heading style={h1}>
            You're <span style={greenText}>Selected!</span>
          </Heading>
          <Text style={headerSub}>
            Your H-1B petition was chosen in the FY2026 lottery
          </Text>
        </Section>

        {/* Body content */}
        <Section style={bodySection}>
          <Text style={intro}>
            This is a huge milestone — congratulations! Now that you're selected, tracking your petition and staying connected with others going through the same process is more important than ever. Here's how to make the most of H1B Pulse:
          </Text>

          <Text style={stepsLabel}>YOUR NEXT TWO STEPS</Text>

          {/* Step 1: Petition Tracker */}
          <Section style={stepCardPrimary}>
            <table role="presentation" width="100%" cellPadding="0" cellSpacing="0">
              <tr>
                <td width="48" style={stepNumTdPrimary}>
                  <div style={stepNumPrimary}>1</div>
                </td>
                <td style={stepContentTd}>
                  <Text style={stepTitle}>
                    Track Your Petition <span style={badgePrimary}>New</span>
                  </Text>
                  <Text style={stepDesc}>
                    File your petition details to track your H-1B journey from selection to approval — and see real-time data from others at your law firm and company.
                  </Text>
                  <Section style={trackerFeatures}>
                    <Text style={featureItem}>● Log your filing date, law firm & premium processing status</Text>
                    <Text style={featureItem}>● See approval timelines from others at your company</Text>
                    <Text style={featureItem}>● Get notified when your peers receive decisions</Text>
                    <Text style={featureItem}>● Track RFE rates by law firm and employer</Text>
                  </Section>
                </td>
              </tr>
            </table>
          </Section>

          {/* Step 2: Discord */}
          <Section style={stepCardSecondary}>
            <table role="presentation" width="100%" cellPadding="0" cellSpacing="0">
              <tr>
                <td width="48" style={stepNumTdSecondary}>
                  <div style={stepNumSecondaryStyle}>2</div>
                </td>
                <td style={stepContentTd}>
                  <Text style={stepTitle}>
                    Join Our Private Community <span style={badgeSecondary}>Members Only</span>
                  </Text>
                  <Text style={stepDesc}>
                    Get access to our gated Discord where selected applicants share real-time updates, attorney recommendations, and support each other through the petition process.
                  </Text>
                </td>
              </tr>
            </table>
          </Section>

          {/* CTA Buttons */}
          <Section style={ctaGroup}>
            <Button style={btnPrimary} href={PETITION_URL}>
              📋 File Your Petition Details →
            </Button>
          </Section>
          <Section style={ctaGroup2}>
            <Button style={btnSecondary} href={DISCORD_URL}>
              💬 Join the Discord Community →
            </Button>
          </Section>
        </Section>

        <Hr style={divider} />

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            Stay informed, stay prepared, and best of luck with your petition filing!
          </Text>
          <Text style={footerText}>
            The more data we collect, the better insights we can provide to everyone.
          </Text>
          <Text style={footerSig}>The {SITE_NAME} Team</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: H1bSelectedCongratsEmail,
  subject: "🎉 Your H-1B was selected — here's what comes next",
  displayName: 'H-1B Selection Congratulations',
  previewData: {},
} satisfies TemplateEntry

// Styles
const main = { backgroundColor: '#f4f4f0', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }
const container = { maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden' as const, boxShadow: '0 4px 32px rgba(0,0,0,0.08)' }

// Header
const header = { backgroundColor: '#0f1f3d', padding: '36px 40px 32px', textAlign: 'center' as const }
const logoArea = { fontSize: '15px', color: '#ffffff', fontWeight: '700' as const, margin: '0 0 24px', letterSpacing: '0.02em' }
const logoDot = { color: '#22c55e', fontSize: '12px' }
const logoText = { color: '#ffffff' }
const confettiEmoji = { fontSize: '36px', margin: '0 0 12px', lineHeight: '1' }
const h1 = { fontSize: '36px', fontWeight: '700' as const, color: '#ffffff', margin: '0 0 8px', lineHeight: '1.1' }
const greenText = { color: '#22c55e' }
const headerSub = { color: '#94a3b8', fontSize: '15px', margin: '0', fontWeight: '400' as const }

// Body
const bodySection = { padding: '36px 40px' }
const intro = { fontSize: '16px', lineHeight: '1.7', color: '#374151', margin: '0 0 28px' }
const stepsLabel = { fontSize: '11px', fontWeight: '700' as const, letterSpacing: '0.12em', color: '#9ca3af', margin: '0 0 14px' }

// Step cards
const stepCardPrimary = { border: '1.5px solid #22c55e', borderRadius: '12px', padding: '20px 22px', marginBottom: '14px', backgroundColor: '#f0fdf4' }
const stepCardSecondary = { border: '1.5px solid #818cf8', borderRadius: '12px', padding: '20px 22px', marginBottom: '14px', backgroundColor: '#eef2ff' }

const stepNumTdPrimary = { verticalAlign: 'top' as const, paddingRight: '16px', paddingTop: '1px' }
const stepNumTdSecondary = { verticalAlign: 'top' as const, paddingRight: '16px', paddingTop: '1px' }
const stepContentTd = { verticalAlign: 'top' as const }

const stepNumPrimary = { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#22c55e', color: '#ffffff', fontSize: '14px', fontWeight: '700' as const, textAlign: 'center' as const, lineHeight: '32px' }
const stepNumSecondaryStyle = { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#818cf8', color: '#ffffff', fontSize: '14px', fontWeight: '700' as const, textAlign: 'center' as const, lineHeight: '32px' }

const stepTitle = { fontSize: '15px', fontWeight: '700' as const, color: '#111827', margin: '0 0 4px' }
const stepDesc = { fontSize: '14px', color: '#4b5563', lineHeight: '1.6', margin: '0' }

const badgePrimary = { display: 'inline-block' as const, fontSize: '11px', fontWeight: '600' as const, padding: '2px 8px', borderRadius: '20px', backgroundColor: '#dcfce7', color: '#16a34a', marginLeft: '6px', verticalAlign: 'middle' as const }
const badgeSecondary = { display: 'inline-block' as const, fontSize: '11px', fontWeight: '600' as const, padding: '2px 8px', borderRadius: '20px', backgroundColor: '#e0e7ff', color: '#4338ca', marginLeft: '6px', verticalAlign: 'middle' as const }

const trackerFeatures = { backgroundColor: '#f9fafb', borderRadius: '10px', padding: '14px 18px', marginTop: '10px' }
const featureItem = { fontSize: '13px', color: '#374151', lineHeight: '1.8', margin: '0', padding: '0' }

// CTAs
const ctaGroup = { textAlign: 'center' as const, marginTop: '28px' }
const ctaGroup2 = { textAlign: 'center' as const, marginTop: '12px' }
const btnPrimary = { backgroundColor: '#22c55e', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, padding: '15px 24px', borderRadius: '10px', textDecoration: 'none', display: 'block' as const, textAlign: 'center' as const, width: '100%' }
const btnSecondary = { backgroundColor: '#4f46e5', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, padding: '15px 24px', borderRadius: '10px', textDecoration: 'none', display: 'block' as const, textAlign: 'center' as const, width: '100%' }

// Footer
const divider = { borderColor: '#f0f0f0', margin: '0 40px' }
const footer = { padding: '28px 40px 32px', textAlign: 'center' as const }
const footerText = { fontSize: '13px', color: '#9ca3af', lineHeight: '1.6', margin: '0 0 4px' }
const footerSig = { fontSize: '14px', color: '#6b7280', fontWeight: '500' as const, marginTop: '16px' }
