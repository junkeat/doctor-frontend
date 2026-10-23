import { ConsultationType } from '../../core/models';

export function consultationTypeLabel(type: ConsultationType): string {
  return type === 'video' ? 'Video Call' : 'Chat';
}
