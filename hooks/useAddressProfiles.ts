import { useState, useEffect } from 'react';
import attestationConfig from "@/constants/attestaion";
import { PROFILES_QUERY } from "@/graphql/queries";

interface AddressProfile {
  nickname: string;
  avatar: string;
}

export function useAddressProfiles(addresses: `0x${string}`[]) {
  const [profiles, setProfiles] = useState<Record<string, AddressProfile>>({});

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!addresses.length) return;

      try {
        const uniqueAddresses = Array.from(
          new Set(addresses.map(addr => addr.toLowerCase()))
        );

        const response = await fetch(
          "https://api.studio.thegraph.com/query/67521/verax-v2-linea-sepolia/v0.0.2",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: PROFILES_QUERY,
              variables: {
                addresses: uniqueAddresses,
                schemaId: attestationConfig.schema,
              },
            }),
          }
        );

        const data = await response.json();
        const newProfiles: Record<string, AddressProfile> = {};

        data.data?.attestations?.forEach((attestation: any) => {
          const [nickname, avatar] = attestation.decodedData;
          newProfiles[attestation.subject.toLowerCase()] = {
            nickname,
            avatar
          };
        });

        setProfiles(newProfiles);
      } catch (error) {
        console.error("Failed to fetch profiles:", error);
      }
    };

    fetchProfiles();
  }, [addresses.join(',')]);

  return profiles;
}