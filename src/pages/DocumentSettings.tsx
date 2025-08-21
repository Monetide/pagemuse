import { useParams } from "react-router-dom";

const DocumentSettings = () => {
  const { id } = useParams();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Document Settings</h1>
      <p className="text-muted-foreground">Settings for document {id} - Coming soon...</p>
    </div>
  );
};

export default DocumentSettings;