import { Upload, Ambulance } from "lucide-react";

export const DirectionUploadCard = ({ direction, onUpload, analysis }: any) => {
  return (
    <div className="border rounded-xl p-4 space-y-2">
      <h3 className="font-bold uppercase">{direction}</h3>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files && onUpload(e.target.files[0])}
      />

      {analysis && (
        <div className="text-sm">
          {analysis.ambulance ? (
            <span className="text-red-600 flex items-center gap-1">
              <Ambulance className="w-4 h-4" />
              Ambulance ({analysis.confidence})
            </span>
          ) : (
            <span className="text-green-600">No ambulance</span>
          )}
        </div>
      )}
    </div>
  );
};
