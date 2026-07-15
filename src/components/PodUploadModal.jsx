import { useState } from 'react';
import { submitPod } from '../api.js';

export default function PodUploadModal({ orderId, onClose, onSubmitted }) {
    const [photoBase64, setPhotoBase64] = useState('');
    const [preview, setPreview] = useState('');
    const [signatureName, setSignatureName] = useState('');
    const [notes, setNotes] = useState('');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');

    const onFile = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = String(reader.result || '');
            const comma = dataUrl.indexOf(',');
            const b64 = comma >= 0 ? dataUrl.substring(comma + 1) : dataUrl;
            setPhotoBase64(b64);
            setPreview(dataUrl);
        };
        reader.readAsDataURL(f);
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!signatureName.trim()) { setErr('Signature name required'); return; }
        setBusy(true);
        setErr('');
        try {
            const res = await submitPod(orderId, {
                photoBase64: photoBase64 || null,
                signatureName: signatureName.trim(),
                notes: notes.trim() || null
            });
            onSubmitted?.(res);
            onClose?.();
        } catch (ex) {
            setErr(ex.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-head">
                    <h3>Proof of delivery · {orderId}</h3>
                    <button className="drawer-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={submit} className="modal-body">
                    <label className="modal-field">
                        <span>BOL / signed paperwork photo</span>
                        <input type="file" accept="image/*" capture="environment" onChange={onFile} />
                        {preview && <img src={preview} alt="pod preview" className="pod-preview" />}
                    </label>
                    <label className="modal-field">
                        <span>Consignee signature (printed name)</span>
                        <input
                            type="text"
                            value={signatureName}
                            onChange={e => setSignatureName(e.target.value)}
                            placeholder="John Smith"
                            required
                        />
                    </label>
                    <label className="modal-field">
                        <span>Notes (optional)</span>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={2}
                            placeholder="Delivered to loading dock 3, no damage"
                        />
                    </label>
                    {err && <div className="duty-err">⚠ {err}</div>}
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="text-btn">Cancel</button>
                        <button type="submit" className="btn-primary" disabled={busy || !signatureName.trim()}>
                            {busy ? '…' : 'Submit POD & mark delivered'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
