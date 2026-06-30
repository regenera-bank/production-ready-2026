/*
|---------------------------------------------------------------------------------------|
|  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
|---------------------------------------------------------------------------------------|

PROJECT:       Regenera Bank
CEO:           Raphaela Cerveski
DEVELOPER:     Don Paulo Ricardo
ID:            2098233287
COPYRIGHT:     Copyright (c) 2026 Regenera Corporate

LICENSE:       EULA (End-User License Agreement)
PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA

WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
               engenharia reversa ou modificação não autorizada.

|---------------------------------------------------------------------------------------|
|  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
|---------------------------------------------------------------------------------------|
*/

import React, { useState, useEffect, useRef } from 'react';
import { AppLayout } from '../../../shared/ui/AppLayout';
import { api } from '../../../core/api/client';
import { useStore } from '../../../shared/lib/store';
import { Server, Power, Loader2, Cpu, MemoryStick as Memory, ShieldAlert } from 'lucide-react';

// Cloud toggles require biometric step-up + backend IAM check (custom claim super_admin from Identity Toolkit JWT).
// Backend uses Secret Manager for any infra creds. Matches MANIFESTE IAM + step-up.

interface Instance {
  id: string;
  name: string;
  status: 'RUNNING' | 'TERMINATED' | 'STAGING' | 'PROVISIONING';
  zone: string;
  machineType: string;
}

export const GCPDashboard: React.FC = () => {
  const { showFeedback } = useStore();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [stepUpRequiredFor, setStepUpRequiredFor] = useState<string | null>(null); // instanceId pending step-up
  const [stepUpLoading, setStepUpLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stepUpStream, setStepUpStream] = useState<MediaStream | null>(null);

  const fetchInstances = async () => {
    try {
      setLoading(true);
      const data = await api.url('/infra/cloud/instances').get().json<Instance[]>();
      setInstances(data || []);
    } catch (e) {
      setInstances([]);
      showFeedback('Infraestrutura indisponível. Verifique credenciais / conectividade.', 'alert');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstances();
  }, []);

  // Biometric step-up before any infra mutation. Backend validates via Cloud Vision + IAM claim.
  const performStepUpCapture = async (instanceId: string, action: string): Promise<boolean> => {
    setStepUpLoading(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 640 }
      });
      setStepUpStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // No artificial delay - capture as soon as stream assigned (real getUserMedia already succeeded).
      // User positions before clicking "Capturar para step-up".
      if (!videoRef.current || !canvasRef.current) {
        throw new Error('Camera elements not ready');
      }

      const context = canvasRef.current.getContext('2d');
      if (!context) throw new Error('No canvas ctx');

      context.drawImage(videoRef.current, 0, 0, 400, 400);
      const base64Image = canvasRef.current.toDataURL('image/jpeg', 0.8);

      // Stop stream immediately after capture
      mediaStream.getTracks().forEach(t => t.stop());
      setStepUpStream(null);
      if (videoRef.current) videoRef.current.srcObject = null;

      // CONTRACT: livenessRequired signals backend to run GCP Cloud Vision face detection + liveness/anti-spoof
      const enrollRes = await api.url('/auth/face-enrollment').post({
        imageBase64: base64Image,
        livenessRequired: true,
        mode: 'step-up-cloud',
        timestamp: Date.now(),
        instanceId, // for audit
        action,
      }).json<any>();

      if (enrollRes?.success || enrollRes?.status === 'ok' || enrollRes?.verified) {
        showFeedback('Step-up biométrico validado. Executando ação na infra (IAM + Cloud Run Admin).', 'success');
        return true;
      }
      showFeedback('Falha na verificação de vivacidade (Cloud Vision). Ação bloqueada.', 'alert');
      return false;
    } catch (err: any) {
      console.error('Step-up capture error', err);
      showFeedback('Não foi possível capturar biometria para step-up. Ação de infra cancelada.', 'alert');
      // cleanup
      if (stepUpStream) {
        stepUpStream.getTracks().forEach(t => t.stop());
      }
      setStepUpStream(null);
      return false;
    } finally {
      setStepUpLoading(false);
      setStepUpRequiredFor(null);
    }
  };

  const handleToggle = async (instanceId: string, _currentStatus: string) => {
    // Require fresh biometric step-up for every toggle.
    setStepUpRequiredFor(instanceId);
  };

  const confirmStepUpAndToggle = async (instanceId: string, currentStatus: string) => {
    const action = currentStatus === 'RUNNING' ? 'stop' : 'start';
    const ok = await performStepUpCapture(instanceId, action);
    if (!ok) return;

    setToggling(instanceId);
    try {
      // This call reaches backend that uses IAM API + checks custom claim before calling real Compute/Run Admin.
      await api.url('/infra/cloud/toggle').post({ instanceId, action }).res();
      await fetchInstances();
      showFeedback(`Ação ${action} enviada para ${instanceId}.`, 'success');
    } catch (e: any) {
      showFeedback('Falha ao alterar estado da instância (verifique privilégios IAM da Service Account).', 'alert');
    } finally {
      setToggling(null);
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (stepUpStream) {
        stepUpStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [stepUpStream]);

  return (
    <AppLayout title="Regenera Cloud" activeTab="home">

      <div className="px-5 space-y-6">
        <div className="bg-gradient-to-br from-indigo-950/20 to-bg-mid border border-indigo-500/20 rounded-[24px] p-6">
          <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mb-2">Status da Infraestrutura</p>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-light text-white">Google Cloud</h2>
              <p className="text-xs text-gray-500 mt-1">southamerica-east1 (São Paulo)</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Server className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-1">Máquinas Virtuais (Compute Engine)</p>
          
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : (
            instances.map(inst => (
              <div key={inst.id} className="bg-[#0d1526] border border-white/5 rounded-[20px] p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${inst.status === 'RUNNING' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    <div>
                      <h3 className="text-sm font-bold text-white">{inst.name}</h3>
                      <p className="text-[10px] text-gray-500 uppercase font-mono">{inst.zone}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleToggle(inst.id, inst.status)}
                    disabled={toggling === inst.id || stepUpRequiredFor === inst.id}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      inst.status === 'RUNNING' 
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' 
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                    }`}
                  >
                    {toggling === inst.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-4">
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-wider">
                    <Cpu className="w-3 h-3" /> {inst.machineType}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-wider">
                    <Memory className="w-3 h-3" /> Persistent Disk
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* STEP-UP BIOMETRIC GATE (rendered when user attempts infra mutation) */}
        {stepUpRequiredFor && (
          <div className="mt-6 p-5 bg-red-950/30 border border-red-500/30 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <p className="text-red-400 text-xs font-black uppercase tracking-[0.3em]">STEP-UP OBRIGATÓRIO — IAM / CLOUD ADMIN</p>
            </div>
            <p className="text-xs text-red-300 mb-4">Para alterar servidores (Compute/Cloud Run), re-confirme sua identidade com biometria fresca. Isso garante que apenas o titular com claim super_admin (via Identity Toolkit + IAM) pode controlar a infraestrutura.</p>

            <div className="relative w-full aspect-square max-w-[220px] mx-auto bg-black rounded-2xl overflow-hidden border border-red-500/30 mb-4">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
              {!stepUpStream && (
                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-red-400/70">Câmera ociosa — pressione CAPTURAR</div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  const inst = instances.find(i => i.id === stepUpRequiredFor);
                  if (inst) await confirmStepUpAndToggle(stepUpRequiredFor, inst.status);
                }}
                disabled={stepUpLoading}
                className="flex-1 py-3 bg-red-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest disabled:opacity-50"
              >
                {stepUpLoading ? 'Validando com Cloud Vision...' : 'CAPTURAR E VALIDAR STEP-UP'}
              </button>
              <button
                onClick={() => {
                  if (stepUpStream) stepUpStream.getTracks().forEach(t => t.stop());
                  setStepUpStream(null);
                  setStepUpRequiredFor(null);
                }}
                className="flex-1 py-3 bg-white/5 text-gray-400 rounded-2xl text-xs font-bold uppercase tracking-widest"
              >
                CANCELAR
              </button>
            </div>
            <p className="text-[9px] text-center text-red-400/60 mt-2">Backend executará detecção facial + anti-spoof via Cloud Vision API antes de autorizar.</p>
          </div>
        )}

        {/* Hidden canvas for step-up frame grab + video element is above when active */}
        <canvas ref={canvasRef} width="400" height="400" className="hidden" />
        {/* The video is mounted inside the step-up card when active */}
      </div>
    </AppLayout>
  );
};
