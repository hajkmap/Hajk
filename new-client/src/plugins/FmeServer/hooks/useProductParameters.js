import { useState, useEffect } from "react";

export default function useProductParameters(groupName, workspaceName, model) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parameters, setParameters] = useState([]);

  useEffect(() => {
    const fetchParameters = async () => {
      setLoading(true);
      setError(false);
      const { error, parameters } = await model.getProductParameters(
        groupName,
        workspaceName
      );
      if (error) {
        setError(true);
      }
      setLoading(false);
      setParameters(parameters);
    };

    fetchParameters();
  }, [model, groupName, workspaceName]);

  return { error, loading, parameters };
}
