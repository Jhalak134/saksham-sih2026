import { permanentRedirect } from 'next/navigation';

export default function AssessmentNewRedirectPage(): never {
  permanentRedirect('/new-assessment');
}

