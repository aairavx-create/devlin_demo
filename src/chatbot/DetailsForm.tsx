
/** One form in the chat for name, phone and full address (instead of three separate questions). */
import { FormEvent, useState } from 'react';
import type { ContactDetails, MessageUi } from './types';

type FormUi = Extract<MessageUi, { type: 'contact_form' }>;

export default function DetailsForm({
  ui,
  onSubmit,
  busy
}: Readonly<{ ui: FormUi; onSubmit: (details: ContactDetails) => void; busy: boolean }>) {
  const [name, setName] = useState(ui.prefill?.name ?? '');
  const [phone, setPhone] = useState(ui.prefill?.phone ?? '');
  const [address, setAddress] = useState(ui.prefill?.address ?? '');
  const errors = ui.errors ?? {};

  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit({ name: name.trim(), phone: phone.trim(), address: address.trim() });
  }

  const ready = name.trim().length > 1 && phone.trim().length > 5 && address.trim().length > 5;

  return (
    <form className="cb-details" onSubmit={submit} noValidate>
      <label className="cb-field">
        <span>Full name</span>
        <input
          type="text"
          autoComplete="name"
          value={name}
          maxLength={80}
          onChange={e => setName(e.target.value)}
          aria-invalid={!!errors.name}
          required
        />
        {errors.name && <small className="cb-field-error">{errors.name}</small>}
      </label>
      <label className="cb-field">
        <span>Phone number</span>
        <input
          type="tel"
          autoComplete="tel"
          placeholder="+44 7700 900123"
          value={phone}
          maxLength={30}
          onChange={e => setPhone(e.target.value)}
          aria-invalid={!!errors.phone}
          required
        />
        {errors.phone && <small className="cb-field-error">{errors.phone}</small>}
      </label>
      <label className="cb-field">
        <span>Full address, including postcode</span>
        <textarea
          rows={3}
          autoComplete="street-address"
          value={address}
          maxLength={200}
          onChange={e => setAddress(e.target.value)}
          aria-invalid={!!errors.address}
          required
        />
        {errors.address && <small className="cb-field-error">{errors.address}</small>}
      </label>
      <button type="submit" className="cb-start-btn" disabled={!ready || busy}>
        Continue
      </button>
    </form>
  );
}
