'use client';

import React, { useState, useEffect, useCallback } from 'react';

import { Button } from '@core/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@core/ui/components/ui/card';
import { Input } from '@core/ui/components/ui/input';
import { Label } from '@core/ui/components/ui/label';
import { Separator } from '@core/ui/components/ui/separator';
import { Textarea } from '@core/ui/components/ui/textarea';
import { UserDTO } from '@core/user/application/dtos/user.dto';

/**
 * 開発テスト用: ユーザー管理機能テストページ
 * 将来的に削除されることを前提としています。
 */
export default function DevUserManagementPage() {
  // === Create User State ===
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createIsLoading, setCreateIsLoading] = useState(false);
  const [createResult, setCreateResult] = useState<string | null>(null);

  // === List Users State ===
  const [listLimit, setListLimit] = useState('10');
  const [listOffset, setListOffset] = useState('0');
  const [listEmail, setListEmail] = useState(''); // Emailでのフィルタリング用
  const [listIsLoading, setListIsLoading] = useState(false);
  const [listResult, setListResult] = useState<string | null>(null);

  // === Get User by ID State ===
  const [getUserId, setGetUserId] = useState('');
  const [getIsLoading, setGetIsLoading] = useState(false);
  const [getResult, setGetResult] = useState<string | null>(null);

  // === Update User State ===
  const [updateUserId, setUpdateUserId] = useState('');
  const [updateName, setUpdateName] = useState('');
  const [updateIsLoading, setUpdateIsLoading] = useState(false);
  const [updateResult, setUpdateResult] = useState<string | null>(null);

  // === Delete User State ===
  const [deleteUserId, setDeleteUserId] = useState('');
  const [deleteIsLoading, setDeleteIsLoading] = useState(false);
  const [deleteResult, setDeleteResult] = useState<string | null>(null);

  // --- API Handlers (Direct Implementation) ---

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateIsLoading(true);
    setCreateResult(null);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName,
          email: createEmail,
          passwordPlainText: createPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      setCreateResult(`Success (Create User):\n${JSON.stringify(data, null, 2)}`);
      setCreateName('');
      setCreateEmail('');
      setCreatePassword('');
    } catch (error) {
      console.error('Failed to Create User:', error);
      setCreateResult(
        `Error (Create User): ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setCreateIsLoading(false);
    }
  };

  const handleListUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    setListIsLoading(true);
    setListResult(null);
    try {
      const params = new URLSearchParams();
      if (listEmail) {
        params.append('email', listEmail);
      } else {
        if (listLimit) params.append('limit', listLimit);
        if (listOffset) params.append('offset', listOffset);
      }
      const response = await fetch(`/api/users?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      setListResult(`Success (List Users):\n${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('Failed to List Users:', error);
      setListResult(
        `Error (List Users): ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setListIsLoading(false);
    }
  };

  const handleGetUserById = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!getUserId) {
      setGetResult('Error: User ID is required.');
      return;
    }
    setGetIsLoading(true);
    setGetResult(null);
    try {
      const response = await fetch(`/api/users/${getUserId}`);
      if (response.status === 404) {
        let message = `User with ID ${getUserId} not found.`;
        try {
          const data = await response.json();
          message = data.message || message;
        } catch {
          /* ignore */
        }
        throw new Error(message);
      }
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      setGetResult(`Success (Get User by ID):\n${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('Failed to Get User by ID:', error);
      setGetResult(
        `Error (Get User by ID): ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setGetIsLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateUserId) {
      setUpdateResult('Error: User ID is required.');
      return;
    }
    if (!updateName) {
      setUpdateResult('Error: Name is required for update.');
      return;
    }
    setUpdateIsLoading(true);
    setUpdateResult(null);
    try {
      const response = await fetch(`/api/users/${updateUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: updateName }),
      });
      if (response.status === 404) {
        let message = `User with ID ${updateUserId} not found.`;
        try {
          const data = await response.json();
          message = data.message || message;
        } catch {
          /* ignore */
        }
        throw new Error(message);
      }
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      setUpdateResult(`Success (Update User):\n${JSON.stringify(data, null, 2)}`);
      setUpdateUserId('');
      setUpdateName('');
    } catch (error) {
      console.error('Failed to Update User:', error);
      setUpdateResult(
        `Error (Update User): ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setUpdateIsLoading(false);
    }
  };

  const handleDeleteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteUserId) {
      setDeleteResult('Error: User ID is required.');
      return;
    }
    setDeleteIsLoading(true);
    setDeleteResult(null);
    try {
      const response = await fetch(`/api/users/${deleteUserId}`, {
        method: 'DELETE',
      });
      if (response.status === 204) {
        setDeleteResult(`Success (Delete User): User ${deleteUserId} deleted successfully.`);
        setDeleteUserId('');
        return; // Exit early on success
      }
      if (response.status === 404) {
        let message = `User with ID ${deleteUserId} not found.`;
        try {
          const data = await response.json();
          message = data.message || message;
        } catch {
          /* ignore */
        }
        throw new Error(message);
      }
      // Handle other errors
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    } catch (error) {
      console.error('Failed to Delete User:', error);
      setDeleteResult(
        `Error (Delete User): ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setDeleteIsLoading(false);
    }
  };

  // --- Render ---
  return (
    <div className="container mx-auto space-y-6 p-4">
      {/* === Create User Card === */}
      <Card className="mx-auto w-full max-w-lg">
        <CardHeader>
          <CardTitle>Dev Test: Create User</CardTitle>
          <CardDescription>Test user creation functionality.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleCreateUser}>
            <div>
              <Label htmlFor="create-name">Name</Label>
              <Input
                required
                id="create-name"
                placeholder="Enter user name"
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="create-email">Email</Label>
              <Input
                required
                id="create-email"
                placeholder="Enter user email"
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="create-password">Password</Label>
              <Input
                required
                id="create-password"
                minLength={8}
                placeholder="Enter password"
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
              />
            </div>
            <Button disabled={createIsLoading} type="submit">
              {createIsLoading ? 'Creating...' : 'Create User'}
            </Button>
          </form>
        </CardContent>
        {createResult && (
          <CardFooter>
            <div className="mt-4 w-full">
              <Label htmlFor="create-result">Create Result</Label>
              <Textarea
                readOnly
                className="h-32 w-full font-mono text-sm"
                id="create-result"
                value={createResult}
              />
            </div>
          </CardFooter>
        )}
      </Card>

      {/* === List Users Card === */}
      <Card className="mx-auto w-full max-w-lg">
        <CardHeader>
          <CardTitle>Dev Test: List Users</CardTitle>
          <CardDescription>Test user listing (pagination or email filter).</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleListUsers}>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="list-limit">Limit</Label>
                <Input
                  disabled={!!listEmail}
                  id="list-limit"
                  min="1"
                  placeholder="e.g., 10"
                  type="number"
                  value={listLimit}
                  onChange={(e) => setListLimit(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="list-offset">Offset</Label>
                <Input
                  disabled={!!listEmail}
                  id="list-offset"
                  min="0"
                  placeholder="e.g., 0"
                  type="number"
                  value={listOffset}
                  onChange={(e) => setListOffset(e.target.value)}
                />
              </div>
            </div>
            <Separator className="my-4" />
            <div>
              <Label htmlFor="list-email">Filter by Email (Overrides Limit/Offset)</Label>
              <Input
                id="list-email"
                placeholder="Enter email to filter"
                type="email"
                value={listEmail}
                onChange={(e) => setListEmail(e.target.value)}
              />
            </div>
            <Button disabled={listIsLoading} type="submit">
              {listIsLoading ? 'Listing...' : 'List Users'}
            </Button>
          </form>
        </CardContent>
        {listResult && (
          <CardFooter>
            <div className="mt-4 w-full">
              <Label htmlFor="list-result">List Result</Label>
              <Textarea
                readOnly
                className="h-48 w-full font-mono text-sm"
                id="list-result"
                value={listResult}
              />
            </div>
          </CardFooter>
        )}
      </Card>

      {/* === Get User by ID Card === */}
      <Card className="mx-auto w-full max-w-lg">
        <CardHeader>
          <CardTitle>Dev Test: Get User by ID</CardTitle>
          <CardDescription>Test fetching a single user.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleGetUserById}>
            <div>
              <Label htmlFor="get-user-id">User ID</Label>
              <Input
                required
                id="get-user-id"
                placeholder="Enter User ID to fetch"
                type="text"
                value={getUserId}
                onChange={(e) => setGetUserId(e.target.value)}
              />
            </div>
            <Button disabled={getIsLoading} type="submit">
              {getIsLoading ? 'Fetching...' : 'Get User'}
            </Button>
          </form>
        </CardContent>
        {getResult && (
          <CardFooter>
            <div className="mt-4 w-full">
              <Label htmlFor="get-result">Get Result</Label>
              <Textarea
                readOnly
                className="h-32 w-full font-mono text-sm"
                id="get-result"
                value={getResult}
              />
            </div>
          </CardFooter>
        )}
      </Card>

      {/* === Update User Card === */}
      <Card className="mx-auto w-full max-w-lg">
        <CardHeader>
          <CardTitle>Dev Test: Update User</CardTitle>
          <CardDescription>Test updating a user&apos;s name.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleUpdateUser}>
            <div>
              <Label htmlFor="update-user-id">User ID</Label>
              <Input
                required
                id="update-user-id"
                placeholder="Enter User ID to update"
                type="text"
                value={updateUserId}
                onChange={(e) => setUpdateUserId(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="update-name">New Name</Label>
              <Input
                required
                id="update-name"
                placeholder="Enter new name"
                type="text"
                value={updateName}
                onChange={(e) => setUpdateName(e.target.value)}
              />
            </div>
            <Button disabled={updateIsLoading} type="submit">
              {updateIsLoading ? 'Updating...' : 'Update User'}
            </Button>
          </form>
        </CardContent>
        {updateResult && (
          <CardFooter>
            <div className="mt-4 w-full">
              <Label htmlFor="update-result">Update Result</Label>
              <Textarea
                readOnly
                className="h-32 w-full font-mono text-sm"
                id="update-result"
                value={updateResult}
              />
            </div>
          </CardFooter>
        )}
      </Card>

      {/* === Delete User Card === */}
      <Card className="mx-auto w-full max-w-lg">
        <CardHeader>
          <CardTitle>Dev Test: Delete User</CardTitle>
          <CardDescription>Test deleting a user.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleDeleteUser}>
            <div>
              <Label htmlFor="delete-user-id">User ID</Label>
              <Input
                required
                id="delete-user-id"
                placeholder="Enter User ID to delete"
                type="text"
                value={deleteUserId}
                onChange={(e) => setDeleteUserId(e.target.value)}
              />
            </div>
            <Button disabled={deleteIsLoading} type="submit" variant="destructive">
              {deleteIsLoading ? 'Deleting...' : 'Delete User'}
            </Button>
          </form>
        </CardContent>
        {deleteResult && (
          <CardFooter>
            <div className="mt-4 w-full">
              <Label htmlFor="delete-result">Delete Result</Label>
              <Textarea
                readOnly
                className="h-24 w-full font-mono text-sm"
                id="delete-result"
                value={deleteResult}
              />
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
