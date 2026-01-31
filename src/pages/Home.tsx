import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@stellar/design-system";

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">Welcome to Opaque Wallet</h1>
        <p className="text-gray-300 mb-8">Your secure cryptocurrency wallet</p>
        <Button
          onClick={() => {
            void navigate("/wallet");
          }}
          variant="primary"
          size="lg"
        >
          Go to Wallet
        </Button>
      </div>
    </div>
  );
};

export default Home;
