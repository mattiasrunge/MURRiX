import { LoaderFunctionArgs } from 'react-router-dom';

export default function Loader({}: LoaderFunctionArgs) {
  return new Date().toString();
}
