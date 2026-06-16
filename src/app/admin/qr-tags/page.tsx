'use client';

import { useState } from 'react';
import { QrCode, Download, MapPin, Printer } from 'lucide-react';
import { ZONE_LABELS } from '@/lib/complaints';
import type { CampusZone } from '@/lib/complaints';

export default function QRTagsPage() {
    const [selectedZone, setSelectedZone] = useState<CampusZone | 'ALL'>('ALL');
    const [baseUrl, setBaseUrl] = useState('');

    // On mount, set the base URL to current origin
    useState(() => {
        if (typeof window !== 'undefined') {
            setBaseUrl(window.location.origin);
        }
    });

    const zones = Object.keys(ZONE_LABELS) as CampusZone[];
    const displayedZones = selectedZone === 'ALL' ? zones : [selectedZone];

    const generateQRUrl = (zone: CampusZone) => {
        const targetUrl = `${baseUrl}/student/complaints/new?zone=${zone}`;
        return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(targetUrl)}&margin=20`;
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1><QrCode size={28} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 12 }} />Building QR Tags</h1>
                    <p>Generate printable QR codes for campus buildings to allow quick issue reporting.</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <select
                        className="form-input"
                        style={{ width: 220, background: 'var(--bg-glass)' }}
                        value={selectedZone}
                        onChange={(e) => setSelectedZone(e.target.value as CampusZone | 'ALL')}
                    >
                        <option value="ALL">All Zones</option>
                        {zones.map(z => (
                            <option key={z} value={z}>{ZONE_LABELS[z]}</option>
                        ))}
                    </select>
                    <button className="btn btn-outline" onClick={handlePrint}>
                        <Printer size={18} /> Print Codes
                    </button>
                </div>
            </div>

            <div className="responsive-grid-auto" id="qr-grid">
                {displayedZones.map(zone => {
                    const qrUrl = generateQRUrl(zone);
                    return (
                        <div key={zone} className="card" style={{ padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <MapPin size={18} color="var(--accent-primary)" />
                                    {ZONE_LABELS[zone]}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                                    Scan to report an issue in this zone
                                </div>
                            </div>

                            <div style={{ background: 'white', padding: 16, borderRadius: 16, marginBottom: 20, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={qrUrl} alt={`QR Code for ${ZONE_LABELS[zone]}`} width={200} height={200} style={{ display: 'block' }} />
                            </div>

                            <a
                                href={qrUrl}
                                download={`qr_${zone}.png`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-primary"
                                style={{ width: '100%' }}
                            >
                                <Download size={18} /> Download High-Res
                            </a>
                        </div>
                    );
                })}
            </div>

            <style jsx global>{`
                @media print {
                    .sidebar, .mobile-menu-btn, .page-header select, .page-header button {
                        display: none !important;
                    }
                    .main-content {
                        margin-left: 0 !important;
                        padding: 0 !important;
                    }
                    #qr-grid {
                        display: grid !important;
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 20px !important;
                    }
                    .card {
                        border: 2px solid #000 !important;
                        box-shadow: none !important;
                        break-inside: avoid;
                        color: #000 !important;
                    }
                    .btn {
                        display: none !important;
                    }
                    .card div {
                        color: #000 !important;
                    }
                }
            `}</style>
        </div>
    );
}
