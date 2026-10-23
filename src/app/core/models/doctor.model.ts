/** `DoctorResource` from /docs/api.json. */
export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  photo_url: string | null;
  /** Time of day in Asia/Kuala_Lumpur, format `HH:mm:ss` (e.g. `09:00:00`). */
  available_from: string;
  /** Time of day in Asia/Kuala_Lumpur, format `HH:mm:ss` (e.g. `22:00:00`). */
  available_to: string;
  available_now: boolean;
}
