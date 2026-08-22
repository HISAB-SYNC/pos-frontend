"use client";

import { Download, Edit2, Plus, SlidersHorizontal, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { LoadingState } from "@/components/shared/loading-state";
import { createTeamMember, getTeamMembers, getTeamSummary } from "@/lib/api/app-data";
import type { TeamMember, TeamSummary } from "@/lib/api/types";
import { MOCK_IDS } from "@/lib/mock/data";
import { useShopStore } from "@/stores/shop-store";

/* ------------------------------------------------------------------ */
/* Modal: Add New Team Member (Matching Screenshot 2)                 */
/* ------------------------------------------------------------------ */
function AddTeamMemberModal({
  open,
  onClose,
  onCreated,
  shopId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  shopId: string;
}) {
  const [form, setForm] = useState({
    name: "",
    role: "",
    password: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    setIsSubmitting(true);
    try {
      await createTeamMember(shopId, {
        name: form.name.trim(),
        role: form.role || "Shop Sale",
        password: form.password,
      });
      onCreated();
      onClose();
      setForm({
        name: "",
        role: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error(err);
      onCreated();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-[480px] rounded-2xl bg-white p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#111827]">Add New Team Member</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-full text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#111827]"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* User Name */}
          <div className="grid grid-cols-[130px_1fr] items-center gap-3">
            <label className="font-medium text-[#374151]">User Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Enter name"
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          {/* Role */}
          <div className="grid grid-cols-[130px_1fr] items-center gap-3">
            <label className="font-medium text-[#374151]">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            >
              <option value="">Select a role</option>
              <option value="Shop Admin">Shop Admin</option>
              <option value="Shop Sale">Shop Sale</option>
              <option value="Owner">Owner</option>
            </select>
          </div>

          {/* Password */}
          <div className="grid grid-cols-[130px_1fr] items-center gap-3">
            <label className="font-medium text-[#374151]">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter Password"
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          {/* Confirm Password */}
          <div className="grid grid-cols-[130px_1fr] items-center gap-3">
            <label className="font-medium text-[#374151]">Confirm Password</label>
            <input
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              className="h-9 w-full rounded-lg border border-[#e5e7eb] px-3 text-xs text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#e5e7eb] bg-white px-5 py-2 text-xs font-medium text-[#374151] transition-colors hover:bg-slate-50"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-[#111827] px-5 py-2 text-xs font-medium text-white transition-colors hover:bg-[#1f2937] disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Manage Users Page Component (Matching Screenshot 1)            */
/* ------------------------------------------------------------------ */
const PAGE_SIZE = 10;

export default function UsersManagementPage() {
  const activeShopId = useShopStore((state) => state.activeShopId);
  const shopId = activeShopId ?? MOCK_IDS.shop;

  const [summary, setSummary] = useState<TeamSummary | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sum, list] = await Promise.all([getTeamSummary(shopId), getTeamMembers(shopId)]);
      setSummary(sum);
      setMembers(list ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(members.length / PAGE_SIZE));
  const currentMembers = useMemo(
    () => members.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [members, page],
  );

  return (
    <>
      <AddTeamMemberModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={load}
        shopId={shopId}
      />

      <div className="space-y-4">
        {/* ------------------------------------------------------------------ */}
        {/* 1. TOP CARD: Manage Teams Metric Cards                             */}
        {/* ------------------------------------------------------------------ */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-base font-semibold text-[#111827]">Manage Teams</h2>

          {summary && (
            <div className="grid grid-cols-1 divide-y divide-[#f3f4f6] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {/* Metric 1: Total Team Members */}
              <div className="flex items-center justify-between px-6 py-2 first:pl-0">
                <p className="text-xs font-semibold text-[#111827]">Total Team Members</p>
                <p className="text-2xl font-bold text-[#2563eb]">{summary.totalTeamMembers}</p>
              </div>

              {/* Metric 2: Shop Admin */}
              <div className="flex items-center justify-between px-6 py-2">
                <p className="text-xs font-semibold text-[#111827]">Shop Admin</p>
                <p className="text-2xl font-bold text-[#2563eb]">{summary.shopAdminCount}</p>
              </div>

              {/* Metric 3: Shop Sales */}
              <div className="flex items-center justify-between px-6 py-2 last:pr-0">
                <p className="text-xs font-semibold text-[#111827]">Shop Sales</p>
                <p className="text-2xl font-bold text-[#2563eb]">{summary.shopSalesCount}</p>
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* 2. BOTTOM CARD: Teams Catalog & Table                              */}
        {/* ------------------------------------------------------------------ */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
          {/* Header Toolbar */}
          <div className="flex flex-wrap items-center justify-end gap-2.5 px-6 py-4">
            {/* Download button */}
            <button
              type="button"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3.5 text-xs font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
            >
              Download
            </button>

            {/* Filters button */}
            <button
              type="button"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3.5 text-xs font-medium text-[#374151] transition-colors hover:bg-[#f9fafb]"
            >
              <SlidersHorizontal className="size-3.5 text-[#6b7280]" />
              Filters
            </button>

            {/* Add Team button */}
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-[#111827] px-4 text-xs font-medium text-white transition-colors hover:bg-[#1f2937]"
            >
              Add Team
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-xs">
              <thead>
                <tr className="border-b border-[#e5e7eb] text-left text-[#6b7280]">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Joined Date</th>
                  <th className="px-4 py-3 font-medium">Last Login</th>
                  <th className="px-6 py-3 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f9fafb]">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12">
                      <LoadingState />
                    </td>
                  </tr>
                ) : currentMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#9ca3af]">
                      No team members found.
                    </td>
                  </tr>
                ) : (
                  currentMembers.map((member) => (
                    <tr key={member.id} className="transition-colors hover:bg-[#f9fafb]">
                      {/* Name */}
                      <td className="px-6 py-3.5 font-medium text-[#111827]">{member.name}</td>

                      {/* Email */}
                      <td className="px-4 py-3.5 text-[#374151]">{member.email}</td>

                      {/* Role */}
                      <td className="px-4 py-3.5 text-[#374151]">{member.role}</td>

                      {/* Joined Date */}
                      <td className="px-4 py-3.5 text-[#374151]">{member.joinedDate}</td>

                      {/* Last Login */}
                      <td className="px-4 py-3.5 text-[#374151]">{member.lastLogin}</td>

                      {/* Action */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-center gap-3 text-[#6b7280]">
                          <button
                            type="button"
                            title="Edit"
                            className="transition-colors hover:text-[#111827]"
                          >
                            <Edit2 className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            className="transition-colors hover:text-[#ef4444]"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-[#e5e7eb] px-6 py-4">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-xs font-medium text-[#374151] transition-colors hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-xs text-[#6b7280]">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-xs font-medium text-[#374151] transition-colors hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
