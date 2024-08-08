'use client';

import { useQuery } from '@tanstack/react-query';
import { gql, request } from 'graphql-request';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const query = gql`
  {
    boards {
      id
      creator
      name
      description
    }
  }
`;

const url = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT as string;

export default function Boards() {
  const { data } = useQuery({
    queryKey: ['boards'],
    async queryFn() {
      return await request(url, query);
    },
  });

  return (
    <>
      {data?.boards.map((board: any) => ( // Explicitly type board as any
        <Link key={board.id} href={`/board/${board.id}`}>
          <Card>
            <CardHeader>
              <CardTitle>{board.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{board.description}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </>
  );
}
