import Fetch from "./Fetch.js";
import { handleResponse } from "./handleResponse.js";
import {
  Response,
  Problem,
  GroupResponse,
  GroupVersionsResponse,
  GroupVersionMembersResponse,
  GroupRestoreResponse,
  CreateGroupRequest,
  CloneGroupRequest,
  EditGroupRequest,
  AddListToGroupRequest,
  EditGroupModelRequest,
  AddGroupRerankerRequest,
  TransferGroupRequest,
} from "./Types.js";

const enc = encodeURIComponent;

export default class GroupService {
  private readonly path = `group`;
  constructor(private readonly fetch: Fetch) {}

  /** Creates a Group - search multiple Lists by combining them into a Group. */
  async create(request: CreateGroupRequest): Promise<Response<GroupResponse, Problem>> {
    const response = await this.fetch.post(this.path, request);
    return handleResponse(response, async () => (await response.json()) as GroupResponse);
  }

  /** Retrieves the details of a Group. */
  async get(account_name: string, group_name: string): Promise<Response<GroupResponse, Problem>> {
    const response = await this.fetch.get(`${this.path}/${enc(account_name)}/${enc(group_name)}`);
    return handleResponse(response, async () => (await response.json()) as GroupResponse);
  }

  /** Lists the membership versions of a Group, and which is current. */
  async versions(account_name: string, group_name: string): Promise<Response<GroupVersionsResponse, Problem>> {
    const response = await this.fetch.get(`${this.path}/versions/${enc(account_name)}/${enc(group_name)}`);
    return handleResponse(response, async () => (await response.json()) as GroupVersionsResponse);
  }

  /** Retrieves the member Lists pinned at a specific Group membership version. */
  async versionMembers(account_name: string, group_name: string, version: number): Promise<Response<GroupVersionMembersResponse, Problem>> {
    const response = await this.fetch.get(`${this.path}/versions/${enc(account_name)}/${enc(group_name)}/${version}`);
    return handleResponse(response, async () => (await response.json()) as GroupVersionMembersResponse);
  }

  /** Edits Group defaults (search/suggest size, units). */
  async edit(account_name: string, group_name: string, request: EditGroupRequest): Promise<Response<GroupResponse, Problem>> {
    const response = await this.fetch.put(`${this.path}/${enc(account_name)}/${enc(group_name)}`, request);
    return handleResponse(response, async () => (await response.json()) as GroupResponse);
  }

  /** Clones a Group into a new Group, copying its configuration and member Lists. */
  async clone(account_name: string, group_name: string, request: CloneGroupRequest): Promise<Response<GroupResponse, Problem>> {
    const response = await this.fetch.post(`${this.path}/clone/${enc(account_name)}/${enc(group_name)}`, request);
    return handleResponse(response, async () => (await response.json()) as GroupResponse);
  }

  /** Bumps the Group to a new membership version, pinning members to their latest versions. */
  async bumpVersion(account_name: string, group_name: string): Promise<Response<GroupResponse, Problem>> {
    const response = await this.fetch.post(`${this.path}/version/${enc(account_name)}/${enc(group_name)}`, undefined);
    return handleResponse(response, async () => (await response.json()) as GroupResponse);
  }

  /** Rolls the Group's membership forward to a past version. */
  async restore(account_name: string, group_name: string, version: number): Promise<Response<GroupRestoreResponse, Problem>> {
    const response = await this.fetch.post(`${this.path}/restore/${enc(account_name)}/${enc(group_name)}/${version}`, undefined);
    return handleResponse(response, async () => (await response.json()) as GroupRestoreResponse);
  }

  /** Adds a List (at a specific version) to the Group. */
  async addList(account_name: string, group_name: string, request: AddListToGroupRequest): Promise<Response<GroupResponse, Problem>> {
    const response = await this.fetch.put(`${this.path}/list/${enc(account_name)}/${enc(group_name)}`, request);
    return handleResponse(response, async () => (await response.json()) as GroupResponse);
  }

  /** Removes a List from the Group. */
  async removeList(account_name: string, group_name: string, list_name: string): Promise<Response<GroupResponse, Problem>> {
    const response = await this.fetch.delete(`${this.path}/list/${enc(account_name)}/${enc(group_name)}/${enc(list_name)}`);
    return handleResponse(response, async () => (await response.json()) as GroupResponse);
  }

  /** Sets the embedding model used by the Group (queued, converges asynchronously). */
  async setModel(account_name: string, group_name: string, request: EditGroupModelRequest): Promise<Response<GroupResponse, Problem>> {
    const response = await this.fetch.put(`${this.path}/model/${enc(account_name)}/${enc(group_name)}`, request);
    return handleResponse(response, async () => (await response.json()) as GroupResponse);
  }

  /** Removes the Group's explicit model, reverting to the default. */
  async removeModel(account_name: string, group_name: string): Promise<Response<GroupResponse, Problem>> {
    const response = await this.fetch.delete(`${this.path}/model/${enc(account_name)}/${enc(group_name)}`);
    return handleResponse(response, async () => (await response.json()) as GroupResponse);
  }

  /** Sets the reranker applied to Group search results. */
  async setReranker(account_name: string, group_name: string, request: AddGroupRerankerRequest): Promise<Response<GroupResponse, Problem>> {
    const response = await this.fetch.post(`${this.path}/reranker/${enc(account_name)}/${enc(group_name)}`, request);
    return handleResponse(response, async () => (await response.json()) as GroupResponse);
  }

  /** Removes the Group's reranker. */
  async removeReranker(account_name: string, group_name: string): Promise<Response<GroupResponse, Problem>> {
    const response = await this.fetch.delete(`${this.path}/reranker/${enc(account_name)}/${enc(group_name)}`);
    return handleResponse(response, async () => (await response.json()) as GroupResponse);
  }

  /** Moves the Group to a different subscription. */
  async transfer(account_name: string, group_name: string, request: TransferGroupRequest): Promise<Response<GroupResponse, Problem>> {
    const response = await this.fetch.put(`${this.path}/transfer/${enc(account_name)}/${enc(group_name)}`, request);
    return handleResponse(response, async () => (await response.json()) as GroupResponse);
  }

  /** Removes an existing Group. */
  async delete(account_name: string, group_name: string): Promise<Response<void, Problem>> {
    const response = await this.fetch.delete(`${this.path}/${enc(account_name)}/${enc(group_name)}`);
    return handleResponse(response, () => undefined);
  }
}
