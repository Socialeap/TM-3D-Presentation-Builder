import { PropertyQnAPanel } from "./components/PropertyQnAPanel";

function App() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Matterport Property Q&A
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            AI-powered property search using client-side RAG
          </p>
        </div>
        <PropertyQnAPanel />
      </div>
    </div>
  );
}

export default App;
