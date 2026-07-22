import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-slate-800/50 backdrop-blur rounded-lg p-8 border border-cyan-500/20">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-500 mb-8">
          Terms of Service
        </h1>
        
        <div className="prose prose-invert max-w-none text-gray-300 space-y-6">
          
          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">1. Acceptance of Terms</h2>
            <p>By accessing and using NeonLights.cam (the "Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">2. Age Verification & Adult Content Disclaimer</h2>
            <p>The Platform is restricted to individuals who are 18 years of age or older. By using this Platform, you certify that you are at least 18 years old and of legal age in your jurisdiction.</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Age verification is required at registration</li>
              <li>The Platform contains sexually explicit material and adult content</li>
              <li>Access is prohibited for minors and in jurisdictions where adult content is illegal</li>
              <li>You are responsible for complying with local laws regarding adult content access</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">3. User Accounts & Creator Verification</h2>
            <p>Users must provide accurate, complete, and current information to create an account. NeonLights reserves the right to verify identity and age before allowing platform access or creator activity.</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You are responsible for maintaining the confidentiality of your account information</li>
              <li>Creators must undergo identity verification and age confirmation</li>
              <li>AI creators must be clearly disclosed with an AI badge</li>
              <li>Account suspension may result from false information or violations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">4. Prohibited Content & Activities</h2>
            <p>The following are strictly prohibited on NeonLights:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Non-consensual sexual content or deepfakes without disclosure</li>
              <li>Content involving minors (strict zero-tolerance)</li>
              <li>Illegal activities or content</li>
              <li>Harassment, threats, or abuse toward other users or creators</li>
              <li>Spam, fraud, or financial exploitation</li>
              <li>Undisclosed AI-generated content (must display 🤖 badge)</li>
              <li>Impersonation without explicit consent</li>
              <li>Copyright infringement or stolen content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">5. Creator & AI Creator Policy</h2>
            <p><strong>Human Creators:</strong> Must be 18+, verified, and provide valid identification.</p>
            <p><strong>AI Creators:</strong> Permitted and encouraged. All AI creators must:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Display prominent 🤖 AI MODEL badge on all content and profiles</li>
              <li>Clearly state they are AI-generated in bio and disclosures</li>
              <li>Not impersonate real people without consent</li>
              <li>Earn equal revenue split as human creators (same % rates apply)</li>
              <li>Include detailed disclosure: "This is AI-generated content created by [Creator Name]"</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">6. Revenue, Payments & Refunds</h2>
            <p>NeonLights uses a multi-stream revenue model:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Live tips (cash): Creators receive 60%, platform keeps 40%</li>
              <li>Live tips (tokens): Creators receive 15-25%, platform keeps 60-85%</li>
              <li>Private shows: Creators receive 15%, platform 60%, director 15%, pool 10%</li>
              <li>VOD sales: Creators receive 60%, platform keeps 40%</li>
              <li>Subscriptions: Creators receive 85%, platform keeps 15%</li>
              <li>Clip monetization: Creators receive 50%, platform keeps 50%</li>
              <li>Custom content: Creators receive 70%, platform keeps 30%</li>
            </ul>
            <p className="mt-4"><strong>Payouts:</strong> Creators can withdraw earnings monthly via Stripe Connect. Minimum payout: $50. Payouts processed within 3-5 business days.</p>
            <p><strong>Refunds:</strong> Transactions are generally non-refundable. Disputed charges must be reported within 30 days.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">7. Payment Processing & Security</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>All payments processed securely via Stripe</li>
              <li>Credit card information is encrypted and never stored on NeonLights servers</li>
              <li>Chargebacks subject to fees and account suspension</li>
              <li>Fraud prevention measures are in place and enforced</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">8. Intellectual Property Rights</h2>
            <p>Creators retain all rights to their original content. By uploading content, you grant NeonLights a worldwide, royalty-free license to display, distribute, and monetize the content on the Platform.</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Creators cannot transfer content rights to NeonLights</li>
              <li>NeonLights may use clips for marketing purposes with creator consent</li>
              <li>Stolen or infringing content will be removed immediately</li>
              <li>Copyright disputes must be reported via support@neonlights.cam</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">9. Account Termination & Suspension</h2>
            <p>NeonLights may suspend or terminate accounts that:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Violate these Terms of Service</li>
              <li>Contain prohibited content (especially involving minors)</li>
              <li>Engage in fraud or financial crimes</li>
              <li>Harass other users or creators</li>
              <li>Fail age or identity verification</li>
            </ul>
            <p className="mt-4"><strong>Consequences:</strong> Suspended/terminated accounts forfeit earned tokens and cannot be reinstated.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">10. Limitation of Liability</h2>
            <p>NeonLights is provided "as is" without warranties. We are not liable for:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Service interruptions or technical failures</li>
              <li>Loss of earnings or account data</li>
              <li>Third-party actions (theft, fraud, harassment)</li>
              <li>Indirect, incidental, or consequential damages</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">11. Indemnification</h2>
            <p>You agree to indemnify and hold harmless NeonLights, its founders, employees, and partners from any claims, damages, or liabilities arising from your use of the Platform or violation of these Terms.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">12. DMCA & Copyright Enforcement</h2>
            <p>NeonLights respects intellectual property rights. If you believe content on the Platform violates your copyright, submit a DMCA notice to:</p>
            <p className="text-pink-400 font-semibold">dmca@neonlights.cam</p>
            <p className="mt-4">Include: Your contact info, description of infringing content, URL, and statement under penalty of perjury.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">13. Dispute Resolution & Arbitration</h2>
            <p>Any disputes arising from these Terms will be resolved through binding arbitration, not litigation. You waive your right to sue or participate in class actions.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">14. Modifications to Terms</h2>
            <p>NeonLights reserves the right to modify these Terms at any time. Continued use of the Platform constitutes acceptance of revised Terms. Major changes will be announced via email to registered users.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">15. Governing Law</h2>
            <p>These Terms are governed by the laws of the United States. Any legal action must be initiated within one year of the dispute.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">16. Contact & Support</h2>
            <p>For questions or concerns, contact us at:</p>
            <p className="text-pink-400 font-semibold mt-2">
              support@neonlights.cam<br/>
              hello@neonlights.cam
            </p>
          </section>

          <section>
            <p className="text-sm text-gray-400 mt-8">Last Updated: July 2026</p>
            <p className="text-sm text-gray-400">© 2026 NeonLights.cam. All rights reserved.</p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
