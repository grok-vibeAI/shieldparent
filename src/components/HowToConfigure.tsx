import React, { useState } from 'react';
import { Shield, KeyRound, CheckSquare, Layers, Award, Smartphone, Laptop } from 'lucide-react';

export function HowToConfigure() {
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>('android');

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 space-y-6 shadow-sm text-left">
      {/* Header section with platform chooser */}
      <div className="space-y-4 border-b border-slate-100 pb-6">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Cross-Platform Deployment Instructions
            </span>
            <span className="bg-red-50 border border-red-150 text-red-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Greg Garrido - Capstone Project
            </span>
          </div>

          {/* Tab selector */}
          <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200">
            <button
              onClick={() => setActiveTab('android')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'android'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
              Android OS
            </button>
            <button
              onClick={() => setActiveTab('ios')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ios'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Laptop className="w-3.5 h-3.5 text-indigo-600" />
              Apple iOS
            </button>
          </div>
        </div>

        <h3 className="text-xl font-black text-slate-900 font-sans tracking-tight">
          {activeTab === 'android' ? 'Android Deployment & Secure VPN Protocol Integration' : 'Apple iOS Supervision & Encrypted MDM Payload Integration'}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed font-semibold">
          {activeTab === 'android' 
            ? 'How to compile this parental security layout into a resident Android device controller utilizing custom Local VPN service classes (VpnService) for full-device Web browser & background socket filtering.'
            : 'How to deploy GuardianNet to supervised Apple iOS devices (iPhones, iPads) using Apple Configurator 2 configurations or automated Mobile Device Management (MDM) profile enrollment packages.'}
        </p>
      </div>

      {activeTab === 'android' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Step 1: Base manifest setups */}
          <div className="space-y-3 p-4 border border-slate-200 bg-slate-50 rounded-xl">
            <div className="flex gap-2.5 items-center">
              <div className="w-6 h-6 bg-indigo-900 text-white rounded-md flex items-center justify-center text-xs font-bold shadow-sm">1</div>
              <h4 className="font-bold text-sm text-slate-900">Device Admin & Permissions</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Must register the application as a Device Administrator inside the `/app/src/main/AndroidManifest.xml` to lock down uninstall actions.
            </p>
            <pre className="bg-slate-900 p-3 rounded-lg text-[10px] font-mono text-indigo-300 border border-slate-950 overflow-x-auto shadow-inner">
{`<!-- AndroidManifest.xml -->
<receiver
    android:name=".ParentDeviceAdminReceiver"
    android:permission="android.permission.BIND_DEVICE_ADMIN"
    android:exported="true">
    <meta-data
        android:name="android.app.device_admin"
        android:resource="@xml/device_admin_rules" />
</receiver>`}
            </pre>
          </div>

          {/* Step 2: VPN interception pattern */}
          <div className="space-y-3 p-4 border border-slate-200 bg-slate-50 rounded-xl">
            <div className="flex gap-2.5 items-center">
              <div className="w-6 h-6 bg-indigo-900 text-white rounded-md flex items-center justify-center text-xs font-bold shadow-sm">2</div>
              <h4 className="font-bold text-sm text-slate-900">Local VpnService Socket Routing</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Inherit the Kotlin `VpnService` backend class to establish a local TUN interface that intercepts recursive loops. Matches socket packets against blacklisted adult domains.
            </p>
            <pre className="bg-slate-900 p-3 rounded-lg text-[10px] font-mono text-emerald-400 border border-slate-950 overflow-x-auto shadow-inner">
{`// ShieldLocalVpn.kt
class ShieldVpn : VpnService() {
  private var vpnInterface: ParcelFileDescriptor? = null
  override fun onStartCommand(...) {
    val builder = Builder()
    builder.addAddress("10.0.0.1", 24)
    builder.addDnsServer("1.1.1.3") // CleanBrowsing DNS
    vpnInterface = builder.establish()
  }
}`}
            </pre>
          </div>

          {/* Step 3: Anti-Uninstall Safeguard */}
          <div className="space-y-3 p-4 border border-slate-200 bg-slate-50 rounded-xl">
            <div className="flex gap-2.5 items-center">
              <div className="w-6 h-6 bg-indigo-900 text-white rounded-md flex items-center justify-center text-xs font-bold shadow-sm">3</div>
              <h4 className="font-bold text-sm text-slate-950">Uninstall Verification Lock</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              Require the parent's master passcode to bypass uninstall limits. Standard Android `device_admin` blocks unauthorized uninstalls, which requires user confirmation loops in safety parameters.
            </p>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed font-semibold">
              <li>Configure strict device rules in target `device_admin_rules.xml`</li>
              <li>Enforce device owner restrictions via Google ADB setups or local profiles</li>
              <li>Capture attempt parameters to stream telemetry signals back to parent device</li>
            </ul>
          </div>

          {/* Step 4: Real-time API Integration */}
          <div className="space-y-3 p-4 border border-slate-200 bg-slate-50 rounded-xl">
            <div className="flex gap-2.5 items-center">
              <div className="w-6 h-6 bg-indigo-900 text-white rounded-md flex items-center justify-center text-xs font-bold shadow-sm">4</div>
              <h4 className="font-bold text-sm text-slate-950">Student IT Project Portfolio</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              Created for Greg Garrido's Capstone under academic cybersecurity curriculum parameters, focusing on system safety, secure mobile architecture, and kid-safe remote controls.
            </p>
            <div className="flex gap-3 bg-slate-100 p-3 rounded-lg text-xs border border-slate-250 text-slate-700 font-semibold">
              <Award className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>Successfully addresses system-level parental standards, clean browsing forced proxying, and background sockets blockings.</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* iOS Step 1: Managed WebContent Filter Payload */}
          <div className="space-y-3 p-4 border border-slate-200 bg-slate-50 rounded-xl">
            <div className="flex gap-2.5 items-center">
              <div className="w-6 h-6 bg-indigo-900 text-white rounded-md flex items-center justify-center text-xs font-bold shadow-sm">1</div>
              <h4 className="font-bold text-sm text-slate-900">Apple WebContent Filter Payload</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Define a supervised restriction profile payload (<code className="font-mono text-slate-800 text-[10px]">.mobileconfig</code> XML structure) that activates built-in content filters to block adult material across all browsers.
            </p>
            <pre className="bg-slate-900 p-3 rounded-lg text-[10px] font-mono text-indigo-300 border border-slate-950 overflow-x-auto shadow-inner">
{`<!-- WebContent Filter Payload snippet -->
<dict>
  <key>PayloadIdentifier</key>
  <string>com.guardiannet.webfilter</string>
  <key>PayloadType</key>
  <string>com.apple.webcontent-filter</string>
  <key>FilterType</key>
  <string>BuiltIn</string>
  <key>AutoFilterEnabled</key>
  <true/>
</dict>`}
            </pre>
          </div>

          {/* iOS Step 2: System DNS over HTTPS (DoH) Routing */}
          <div className="space-y-3 p-4 border border-slate-200 bg-slate-50 rounded-xl">
            <div className="flex gap-2.5 items-center">
              <div className="w-6 h-6 bg-indigo-900 text-white rounded-md flex items-center justify-center text-xs font-bold shadow-sm">2</div>
              <h4 className="font-bold text-sm text-slate-900">Encrypted DNS Settings Payload</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enforce system-wide DNS routing which directs all web lookups on specific iphones to our secure DNS over HTTPS endpoint, embedding the children device's UUID for individual tracking.
            </p>
            <pre className="bg-slate-900 p-3 rounded-lg text-[10px] font-mono text-emerald-400 border border-slate-950 overflow-x-auto shadow-inner">
{`<!-- DoH Managed DNS Settings payload -->
<dict>
  <key>PayloadType</key>
  <string>com.apple.dnsSettings.managed</string>
  <key>DNSSettings</key>
  <dict>
    <key>DNSProtocol</key>
    <string>HTTPS</string>
    <key>ServerURL</key>
    <string>https://dns.guardiannet.family/\${DeviceUUID}</string>
  </dict>
</dict>`}
            </pre>
          </div>

          {/* iOS Step 3: Apple Supervised Non-Removable MDM Lock */}
          <div className="space-y-3 p-4 border border-slate-200 bg-slate-50 rounded-xl">
            <div className="flex gap-2.5 items-center">
              <div className="w-6 h-6 bg-indigo-900 text-white rounded-md flex items-center justify-center text-xs font-bold shadow-sm">3</div>
              <h4 className="font-bold text-sm text-slate-950">Bypass & Removal Prevention</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              Ensure children cannot remove parental controls from their settings by setting high cryptographic security parameters and supervising via Apple Business/School Manager.
            </p>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed font-semibold">
              <li>Supervise iOS devices through Apple Configurator 2 or ABM Automated Device Enrollment</li>
              <li>Mark the MDM enrollment payload as non-removable (<code className="font-mono text-slate-800 text-[10px]">&lt;key&gt;PayloadRemovalDisallowed&lt;/key&gt;&lt;true/&gt;</code>)</li>
              <li>Deploy passcode payload requirements to restrict Safari private browsing tabs</li>
            </ul>
          </div>

          {/* iOS Step 4: Academic Compliance & Integration */}
          <div className="space-y-3 p-4 border border-slate-200 bg-slate-50 rounded-xl">
            <div className="flex gap-2.5 items-center">
              <div className="w-6 h-6 bg-indigo-900 text-white rounded-md flex items-center justify-center text-xs font-bold shadow-sm">4</div>
              <h4 className="font-bold text-sm text-slate-950">Multi-OS Security Standards</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              Extended and aligned with Apple supervision structures to handle combined networks. Evaluates configuration packets, prevents DNS leaks, and triggers APNs lockdown commands instantly.
            </p>
            <div className="flex gap-3 bg-slate-100 p-3 rounded-lg text-xs border border-slate-250 text-slate-700 font-semibold">
              <Award className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Complies with iOS MDM constraints, secure DNS routing parameters, and school network child protection guidelines.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
