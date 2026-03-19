import { UploadableFile } from './Upload';

export interface Candidate {
  id: string;
  name: string;
  nameMr?: string;
  partyName?: string;
  partyNameMr?: string;
  symbolName?: string;
  candidatePhotoUrl?: string;
  symbolImageUrl?: string;
  isActive?: boolean;
}

export interface CandidateCreateUpdate {
  id?: string;
  name: string;
  nameMr?: string;
  partyName?: string;
  partyNameMr?: string;
  symbolName?: string;
  candidatePhoto?: UploadableFile | null;
  symbolImage?: UploadableFile | null;
  candidatePhotoPath?: string;
}
