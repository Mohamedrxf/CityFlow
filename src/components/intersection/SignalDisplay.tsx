export const SignalDisplay = ({ signals }: any) => {
    return (
      <div className="grid grid-cols-4 gap-4 text-center">
        {Object.entries(signals).map(([dir, state]) => (
          <div
            key={dir}
            className={`p-4 rounded-xl font-bold ${
              state === "GREEN"
                ? "bg-green-200 text-green-800"
                : "bg-red-200 text-red-800"
            }`}
          >
            {dir.toUpperCase()}
            <br />
            {state}
          </div>
        ))}
      </div>
    );
  };
  