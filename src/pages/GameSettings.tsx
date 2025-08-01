import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Volume2, 
  VolumeX, 
  Monitor, 
  Gamepad2, 
  Palette,
  MousePointer,
  Keyboard,
  Eye,
  Save,
  RotateCcw
} from 'lucide-react';
import { gameDataManager, type GameSettings as GameSettingsType } from '../game/data/GameDataManager';

export const GameSettings: React.FC = () => {
  const [settings, setSettings] = useState<GameSettingsType | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setSettings(gameDataManager.getSettings());
  }, []);

  const handleSettingChange = (category: keyof GameSettingsType, setting: string, value: any) => {
    if (!settings) return;
    
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [setting]: value
      }
    };
    
    setSettings(newSettings);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!settings) return;
    
    gameDataManager.updateSettings(settings);
    setHasChanges(false);
    
    toast({
      title: "Settings Saved",
      description: "Your game settings have been updated successfully.",
    });
  };

  const handleReset = () => {
    setSettings(gameDataManager.getSettings());
    setHasChanges(false);
    
    toast({
      title: "Settings Reset",
      description: "Settings have been reset to saved values.",
    });
  };

  if (!settings) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Game Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Customize your Crypto Chaos experience
          </p>
        </div>
        
        {hasChanges && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphics Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Graphics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Graphics Quality</Label>
              <Select 
                value={settings.graphics.quality} 
                onValueChange={(value: 'low' | 'medium' | 'high') => 
                  handleSettingChange('graphics', 'quality', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Particle Effects</Label>
                <Switch
                  checked={settings.graphics.showParticles}
                  onCheckedChange={(checked) => 
                    handleSettingChange('graphics', 'showParticles', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Damage Numbers</Label>
                <Switch
                  checked={settings.graphics.showDamageNumbers}
                  onCheckedChange={(checked) => 
                    handleSettingChange('graphics', 'showDamageNumbers', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Screen Shake</Label>
                <Switch
                  checked={settings.graphics.screenShake}
                  onCheckedChange={(checked) => 
                    handleSettingChange('graphics', 'screenShake', checked)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audio Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {settings.audio.muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              Audio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label>Mute All Audio</Label>
              <Switch
                checked={settings.audio.muted}
                onCheckedChange={(checked) => 
                  handleSettingChange('audio', 'muted', checked)
                }
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Master Volume</Label>
                  <Badge variant="outline">{Math.round(settings.audio.masterVolume * 100)}%</Badge>
                </div>
                <Slider
                  value={[settings.audio.masterVolume]}
                  onValueChange={([value]) => handleSettingChange('audio', 'masterVolume', value)}
                  max={1}
                  min={0}
                  step={0.1}
                  disabled={settings.audio.muted}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Sound Effects</Label>
                  <Badge variant="outline">{Math.round(settings.audio.sfxVolume * 100)}%</Badge>
                </div>
                <Slider
                  value={[settings.audio.sfxVolume]}
                  onValueChange={([value]) => handleSettingChange('audio', 'sfxVolume', value)}
                  max={1}
                  min={0}
                  step={0.1}
                  disabled={settings.audio.muted}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Music</Label>
                  <Badge variant="outline">{Math.round(settings.audio.musicVolume * 100)}%</Badge>
                </div>
                <Slider
                  value={[settings.audio.musicVolume]}
                  onValueChange={([value]) => handleSettingChange('audio', 'musicVolume', value)}
                  max={1}
                  min={0}
                  step={0.1}
                  disabled={settings.audio.muted}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="flex items-center gap-2">
                  <MousePointer className="h-4 w-4" />
                  Mouse Sensitivity
                </Label>
                <Badge variant="outline">{settings.controls.mouseSensitivity.toFixed(1)}x</Badge>
              </div>
              <Slider
                value={[settings.controls.mouseSensitivity]}
                onValueChange={([value]) => handleSettingChange('controls', 'mouseSensitivity', value)}
                max={3}
                min={0.1}
                step={0.1}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label>Invert Y-Axis</Label>
              <Switch
                checked={settings.controls.invertY}
                onCheckedChange={(checked) => 
                  handleSettingChange('controls', 'invertY', checked)
                }
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Keyboard className="h-4 w-4" />
                Key Bindings
              </Label>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {Object.entries(settings.controls.keyBindings).map(([action, key]) => (
                  <div key={action} className="flex justify-between items-center p-2 rounded bg-muted/30">
                    <span className="capitalize">{action.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <Badge variant="outline">{key}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gameplay Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Gameplay
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Kill Feed</Label>
                  <p className="text-xs text-muted-foreground">Display elimination notifications</p>
                </div>
                <Switch
                  checked={settings.gameplay.showKillFeed}
                  onCheckedChange={(checked) => 
                    handleSettingChange('gameplay', 'showKillFeed', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Crosshair</Label>
                  <p className="text-xs text-muted-foreground">Display aiming crosshair</p>
                </div>
                <Switch
                  checked={settings.gameplay.showCrosshair}
                  onCheckedChange={(checked) => 
                    handleSettingChange('gameplay', 'showCrosshair', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Pickup Weapons</Label>
                  <p className="text-xs text-muted-foreground">Automatically collect weapons</p>
                </div>
                <Switch
                  checked={settings.gameplay.autoPickupWeapons}
                  onCheckedChange={(checked) => 
                    handleSettingChange('gameplay', 'autoPickupWeapons', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Player Names</Label>
                  <p className="text-xs text-muted-foreground">Display player names above characters</p>
                </div>
                <Switch
                  checked={settings.gameplay.showPlayerNames}
                  onCheckedChange={(checked) => 
                    handleSettingChange('gameplay', 'showPlayerNames', checked)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {hasChanges && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">You have unsaved changes</p>
                <p className="text-sm text-muted-foreground">Don't forget to save your settings before leaving this page.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};