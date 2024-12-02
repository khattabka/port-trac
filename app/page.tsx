"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TokenData } from "@/types";
import { fetchTokenData } from "@/lib/utils/token";
import { useToast } from "@/hooks/use-toast";
import { usePortfolioStore } from "@/store/use-portfolio-store";
import { FaTelegram, FaDiscord, FaTwitter, FaGlobe } from "react-icons/fa";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  Trash,
  ChevronDown,
  ChevronUp,
  Edit2,
  FolderPlus,
  Copy,
  Pencil,
  Trash2Icon,
  RefreshCw,
} from "lucide-react";
import {
  GroupManager,
  GroupList,
  TokenGroupSelect,
} from "@/components/group-manager";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { RainbowButton } from "@/components/ui/rainbow-button";

interface SocialLinks {
  website?: {
    url: string;
  };
  twitter?: string;
  telegram?: string;
  discord?: string;
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(num);
};

const formatPercentage = (current: number, entry: number) => {
  const percentage = ((current - entry) / entry) * 100;
  return {
    value: Math.abs(percentage).toFixed(2) + "%",
    isPositive: percentage >= 0,
  };
};

export default function Home() {
  const [address, setAddress] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedCards, setExpandedCards] = useState<{
    [key: string]: boolean;
  }>({});
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [newEntryPrice, setNewEntryPrice] = useState("");
  const [selectedTokenForGroup, setSelectedTokenForGroup] = useState<
    string | null
  >(null);
  const [activeView, setActiveView] = useState<"all" | "grouped">("all");
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");
  const [refreshingTokens, setRefreshingTokens] = useState<{
    [key: string]: boolean;
  }>({});
  const { toast } = useToast();
  const {
    tokens,
    addToken,
    removeToken,
    updateEntryData,
    updateTokenData,
    groups,
    startTokenUpdates,
    addTokenNote,
    removeTokenNote,
  } = usePortfolioStore();

  useEffect(() => {
    if (Object.keys(tokens).length > 0) {
      const stopUpdates = startTokenUpdates();

      return () => {
        stopUpdates();
      };
    }
  }, [tokens, startTokenUpdates]);

  const handleAddToken = async () => {
    if (!address) {
      toast({
        title: "Error",
        description: "Please enter a token address",
        variant: "destructive",
      });
      return;
    }

    if (!entryPrice || isNaN(parseFloat(entryPrice))) {
      toast({
        title: "Error",
        description: "Please enter a valid entry price",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const tokenData = await fetchTokenData(address);
      if (!tokenData) {
        toast({
          title: "Error",
          description: "Invalid token or unable to fetch token data",
          variant: "destructive",
        });
        return;
      }

      addToken(address, tokenData, parseFloat(entryPrice));
      setAddress("");
      setEntryPrice("");
      toast({
        title: "Success",
        description: "Token added to portfolio",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch token data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveToken = (address: string) => {
    removeToken(address);
    toast({
      title: "Success",
      description: "Token removed from portfolio",
    });
  };

  const handleUpdateEntryPrice = (address: string) => {
    const price = parseFloat(newEntryPrice);
    if (!newEntryPrice || isNaN(price)) {
      toast({
        title: "Error",
        description: "Please enter a valid price",
        variant: "destructive",
      });
      return;
    }

    const token = tokens[address];
    updateEntryData(address, price, token.marketCap);
    setEditingEntry(null);
    setNewEntryPrice("");
    toast({
      title: "Success",
      description: "Entry price updated",
    });
  };

  const handleRefreshToken = async (address: string) => {
    try {
      setRefreshingTokens((prev) => ({ ...prev, [address]: true }));
      const tokenData = await fetchTokenData(address);
      if (tokenData) {
        // Keep the existing entryData and note while updating the rest
        const { entryData, note } = tokens[address];
        updateTokenData(address, {
          ...tokenData,
          note,
        });
        toast({
          title: "Success",
          description: "Token data refreshed successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh token data",
        variant: "destructive",
      });
    } finally {
      setRefreshingTokens((prev) => ({ ...prev, [address]: false }));
    }
  };

  const toggleCardExpansion = (address: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [address]: !prev[address],
    }));
  };

  const renderTokenCard = (address: string, token: TokenData) => {
    const copyToClipboard = () => {
      navigator.clipboard
        .writeText(address)
        .then(() => {
          toast({
            title: "Copied",
            description: "Token address copied to clipboard",
            duration: 2000,
          });
        })
        .catch((err) => {
          toast({
            title: "Error",
            description: "Failed to copy address",
            variant: "destructive",
          });
        });
    };

    const isExpanded = expandedCards[address];
    const isEditingNote = editingNote === address;
    console.log(token.info);

    return (
      <div key={address} className="grid">
        <Card
          className={`overflow-hidden h-fit ${
            isExpanded ? "border-primary" : ""
          }`}
        >
          {token.info?.header && (
            <div className="relative w-full h-32">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={token.info.header}
                alt={`${token.baseToken?.name} header`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
            </div>
          )}
          <CardContent
            className={`p-4 ${token.info?.header ? "-mt-16 relative" : ""}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {token.info?.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={token.info.imageUrl}
                    alt={token.baseToken?.name}
                    className="w-14 h-14 rounded-full border-2 border-primary/50 shadow-md"
                  />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-2xl">
                      {token.baseToken?.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      {token.baseToken?.symbol}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={copyToClipboard}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    // Only show group selection if groups exist
                    if (Object.keys(groups).length > 0) {
                      setSelectedTokenForGroup(address);
                    } else {
                      toast({
                        title: "No Groups",
                        description: "Please create a group first",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <FolderPlus className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleRemoveToken(address)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRefreshToken(address)}
                  disabled={refreshingTokens[address]}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      refreshingTokens[address] ? "animate-spin" : ""
                    }`}
                  />
                </Button>
              </div>
            </div>
            <div className="flex justify-between items-center my-3">
              {token.info?.socials && (
                <div className="flex items-center justify-center gap-4">
                  {(token.info?.socials as any)?.website?.url && (
                    <Link
                      // @ts-ignore
                      href={token.info.socials?.website?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-500 hover:text-purple-600"
                    >
                      <FaGlobe className="h-6 w-6" />
                    </Link>
                  )}
                  {token.info.socials?.twitter && (
                    <Link
                      href={token.info.socials.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-500 hover:text-purple-600"
                    >
                      <FaTwitter className="h-6 w-6" />
                    </Link>
                  )}
                  {token.info.socials?.telegram && (
                    <Link
                      href={token.info.socials.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-500 hover:text-purple-600"
                    >
                      <FaTelegram className="h-6 w-6" />
                    </Link>
                  )}
                  {token.info.socials?.discord && (
                    <Link
                      href={token.info.socials.discord}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-500 hover:text-purple-600"
                    >
                      <FaDiscord className="h-6 w-6" />
                    </Link>
                  )}
                </div>
              )}
              {/* https://photon-sol.tinyastro.io/en/r/@EMILIAN/HJUfqXoYjC653f2p33i84zdCC3jc4EuVnbruSe5kpump */}
              <div>
                <Button>
                  <Link
                    href={`https://photon-sol.tinyastro.io/en/r/@EMILIAN/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Photon
                  </Link>
                </Button>
              </div>
            </div>

            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Current Price</TableCell>
                  <TableCell>
                    {formatNumber(parseFloat(token.priceUsd || "0"))}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Entry Price</TableCell>
                  <TableCell className="flex items-center justify-between">
                    {editingEntry === address ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={newEntryPrice}
                          onChange={(e) => setNewEntryPrice(e.target.value)}
                          className="w-24 h-8"
                          type="number"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateEntryPrice(address)}
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <>
                        {formatNumber(tokens[address].entryData?.price)}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingEntry(address);
                            setNewEntryPrice(
                              tokens[address].entryData?.price.toString()
                            );
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Performance</TableCell>
                  <TableCell>
                    {(() => {
                      const currentPrice = parseFloat(token.priceUsd || "0");
                      const { value, isPositive } = formatPercentage(
                        currentPrice,
                        tokens[address].entryData?.price
                      );
                      return (
                        <span
                          className={
                            isPositive ? "text-green-600" : "text-red-600"
                          }
                        >
                          {isPositive ? "↑" : "↓"} {value}
                        </span>
                      );
                    })()}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">24h Change</TableCell>
                  <TableCell
                    className={
                      (token.priceChange?.h24 || 0) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {(token.priceChange?.h24 || 0).toFixed(2)}%
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Market Cap</TableCell>
                  <TableCell>{formatNumber(token.marketCap || 0)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div className="mt-2">
              {isEditingNote ? (
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add a note about this token"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-grow"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      addTokenNote(address, newNote);
                      setEditingNote(null);
                      setNewNote("");
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setEditingNote(null);
                      setNewNote("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between space-x-2">
                  <div>
                    {token.note && (
                      <RainbowButton className="w-[200px] flex justify-center cursor-default items-center">
                        {token.note}
                      </RainbowButton>
                    )}
                  </div>
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingNote(address);
                        setNewNote(token.note || "");
                      }}
                    >
                      {token.note ? <Pencil /> : "Add Note"}
                    </Button>
                    {token.note && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTokenNote(address)}
                      >
                        <Trash2Icon />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              className="w-full mt-2 flex items-center justify-between"
              onClick={(e) => {
                e.stopPropagation();
                toggleCardExpansion(address);
              }}
            >
              <span>Details</span>
              {expandedCards[address] ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {expandedCards[address] && (
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Volume</h4>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">5 Minutes</TableCell>
                        <TableCell>
                          {formatNumber(token.volume?.m5 || 0)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">1 Hour</TableCell>
                        <TableCell>
                          {formatNumber(token.volume?.h1 || 0)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">6 Hours</TableCell>
                        <TableCell>
                          {formatNumber(token.volume?.h6 || 0)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">24 Hours</TableCell>
                        <TableCell>
                          {formatNumber(token.volume?.h24 || 0)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Transactions</h4>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">5 Minutes</TableCell>
                        <TableCell>
                          <span className="text-green-600">
                            ↑{token.txns?.m5?.buys || 0}
                          </span>
                          {" / "}
                          <span className="text-red-600">
                            ↓{token.txns?.m5?.sells || 0}
                          </span>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">1 Hour</TableCell>
                        <TableCell>
                          <span className="text-green-600">
                            ↑{token.txns?.h1?.buys || 0}
                          </span>
                          {" / "}
                          <span className="text-red-600">
                            ↓{token.txns?.h1?.sells || 0}
                          </span>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">6 Hours</TableCell>
                        <TableCell>
                          <span className="text-green-600">
                            ↑{token.txns?.h6?.buys || 0}
                          </span>
                          {" / "}
                          <span className="text-red-600">
                            ↓{token.txns?.h6?.sells || 0}
                          </span>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">24 Hours</TableCell>
                        <TableCell>
                          <span className="text-green-600">
                            ↑{token.txns?.h24?.buys || 0}
                          </span>
                          {" / "}
                          <span className="text-red-600">
                            ↓{token.txns?.h24?.sells || 0}
                          </span>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <div className="flex gap-2">
          <ThemeToggle />
          <GroupManager />
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Enter token address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <Input
            placeholder="Entry price"
            type="number"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            className="max-w-[200px]"
          />
        </div>
        <Button onClick={handleAddToken} disabled={loading}>
          {loading ? "Adding..." : "Add Token"}
        </Button>
      </div>

      <Tabs
        value={activeView}
        onValueChange={(v) => setActiveView(v as "all" | "grouped")}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">All Tokens</TabsTrigger>
          <TabsTrigger value="grouped">Grouped View</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(tokens).map(([address, token]) =>
                  renderTokenCard(address, token)
                )}
              </div>
            </div>
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-xl font-semibold">Token Groups</h2>
              <GroupList />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="grouped">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3">
              {Object.entries(groups).map(([groupId, group]) => (
                <div key={groupId} className="mb-6">
                  <h2 className="text-2xl font-bold mb-4">{group.name}</h2>
                  {group.description && (
                    <p className="text-sm text-gray-500 mb-4">
                      {group.description}
                    </p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {group.tokens?.map((tokenAddress) => {
                      const token = tokens[tokenAddress];
                      return token
                        ? renderTokenCard(tokenAddress, token)
                        : null;
                    })}
                    {(!group.tokens || group.tokens.length === 0) && (
                      <p className="text-sm text-gray-500">
                        No tokens in this group
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {Object.keys(groups).length === 0 && (
                <p className="text-center text-gray-500">
                  No groups created. Create a group to start organizing your
                  tokens.
                </p>
              )}
            </div>
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-xl font-semibold">Token Groups</h2>
              <GroupList />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {selectedTokenForGroup && (
        <TokenGroupSelect
          tokenAddress={selectedTokenForGroup}
          onClose={() => setSelectedTokenForGroup(null)}
        />
      )}
    </div>
  );
}
