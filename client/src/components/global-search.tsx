import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, User, Briefcase, Building2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Contact, Job, TradePartner } from "@shared/schema";

interface SearchResults {
  contacts: Contact[];
  jobs: (Job & { contact?: Contact })[];
  partners: TradePartner[];
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: results, isLoading } = useQuery<SearchResults>({
    queryKey: ["/api/search", query],
    queryFn: async () => {
      if (query.length < 2) return { contacts: [], jobs: [], partners: [] };
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      return res.json();
    },
    enabled: query.length >= 2,
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = (type: "contact" | "job" | "partner", id: string) => {
    setIsOpen(false);
    setQuery("");
    if (type === "contact") {
      navigate("/contacts");
    } else if (type === "job") {
      navigate(`/jobs/${id}`);
    } else if (type === "partner") {
      navigate("/partners");
    }
  };

  const hasResults = results && (results.contacts.length > 0 || results.jobs.length > 0 || results.partners.length > 0);

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search clients, jobs, partners... (Ctrl+K)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10"
          data-testid="input-global-search"
        />
        {query && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            data-testid="button-clear-search"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {isOpen && query.length >= 2 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-auto shadow-lg">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : !hasResults ? (
            <div className="py-6 text-center text-muted-foreground text-sm">
              No results found for "{query}"
            </div>
          ) : (
            <div className="p-2">
              {results.contacts.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-muted-foreground px-2 py-1">Clients</p>
                  {results.contacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => handleSelect("contact", contact.id)}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover-elevate text-left"
                      data-testid={`search-result-contact-${contact.id}`}
                    >
                      <User className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{contact.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {contact.email || contact.phone || contact.postcode}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.jobs.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-muted-foreground px-2 py-1">Jobs</p>
                  {results.jobs.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => handleSelect("job", job.id)}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover-elevate text-left"
                      data-testid={`search-result-job-${job.id}`}
                    >
                      <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{job.jobNumber}</p>
                          <Badge variant="outline" className="text-xs">{job.serviceType}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {job.contact?.name} - {job.jobPostcode}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.partners.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground px-2 py-1">Trade Partners</p>
                  {results.partners.map((partner) => (
                    <button
                      key={partner.id}
                      onClick={() => handleSelect("partner", partner.id)}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover-elevate text-left"
                      data-testid={`search-result-partner-${partner.id}`}
                    >
                      <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{partner.businessName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {partner.tradeCategory} - {partner.contactName}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
