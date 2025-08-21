import { useParams, Navigate } from "react-router-dom";

const DocumentModelRedirect = () => {
  const { documentId } = useParams();
  const redirectPath = documentId ? `/documents/${documentId}/editor` : "/documents/new/editor";
  
  return <Navigate to={redirectPath} replace />;
};

export default DocumentModelRedirect;